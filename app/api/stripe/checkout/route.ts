import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { authService } from "@/lib/grpc/client"
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe"
import { isSameOrigin } from "@/lib/security"
import logger from "@/lib/logger"
import { createSubscriptionCheckout, ExistingSubscriptionError } from "@/lib/stripe-checkout"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

export async function POST(request: Request) {
  const authUrl = process.env.AUTH_URL
  if (!authUrl) {
    logger.error("AUTH_URL environment variable is required")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 })
  }

  // CSRF protection: verify origin
  if (!isSameOrigin(request)) {
    logger.error({
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    }, "Stripe checkout CSRF attempt detected")
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    )
  }

  if (!stripe || !STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userResponse = await authService.getUser(
      { userId: session.user.id },
      getGrpcApiKey()
    )
    const user = userResponse.user
    if (user.disabled) return NextResponse.json({ error: "Account disabled" }, { status: 403 })

    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { userId: user.id },
      }, { idempotencyKey: `etu-customer-${user.id}` })
      customerId = customer.id

      await authService.updateUserSubscription(
        {
          userId: user.id,
          subscriptionStatus: user.subscriptionStatus,
          stripeCustomerId: customerId,
          cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        },
        getGrpcApiKey()
      )
    }

    const checkoutSession = await createSubscriptionCheckout(stripe, { ...user, stripeCustomerId: customerId }, STRIPE_PRICE_ID, authUrl)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    if (error instanceof ExistingSubscriptionError) return NextResponse.json({ error: error.message }, { status: 409 })
    logger.error({
      error,
      userId: session.user.id,
    }, "Stripe checkout error")
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
