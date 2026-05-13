import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { authService } from "@/lib/grpc/client"
import { stripe } from "@/lib/stripe"
import { isSameOrigin } from "@/lib/security"
import logger from "@/lib/logger"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    logger.error({
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    }, "Stripe portal CSRF attempt detected")
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    )
  }

  if (!stripe) {
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
    const customerId = userResponse.user.stripeCustomerId

    if (!customerId) {
      return NextResponse.json(
        { error: "No subscription to manage" },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.AUTH_URL}/settings/subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logger.error({
      error,
      userId: session.user.id,
    }, "Stripe portal error")
    return NextResponse.json({ error: "Failed to open portal" }, { status: 500 })
  }
}
