import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { authService, Timestamp } from "@/lib/grpc/client"
import { stripe } from "@/lib/stripe"
import logger from "@/lib/logger"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

function unixToTimestamp(unixSeconds: number): Timestamp {
  return { seconds: Math.floor(unixSeconds).toString(), nanos: 0 }
}

function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
      return "active"
    case "trialing":
      return "trial"
    case "past_due":
      return "past_due"
    case "canceled":
      return "cancelled"
    default:
      return "inactive"
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const userResponse = await authService.getUserByStripeCustomerId(
    { stripeCustomerId: customerId },
    getGrpcApiKey()
  )
  if (!userResponse.user) return

  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end
  const periodStart = item?.current_period_start
  const priceId = item?.price?.id

  await authService.updateUserSubscription(
    {
      userId: userResponse.user.id,
      subscriptionStatus: mapSubscriptionStatus(subscription.status),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscriptionEnd: periodEnd ? unixToTimestamp(periodEnd) : undefined,
      currentPeriodStart: periodStart ? unixToTimestamp(periodStart) : undefined,
    },
    getGrpcApiKey()
  )
}

async function syncCustomerProfile(customer: Stripe.Customer) {
  if (customer.deleted) return
  const userId = customer.metadata?.userId
  if (!userId) return

  const address = customer.address ?? undefined
  await authService.updateUserStripeCustomer(
    {
      userId,
      name: customer.name ?? undefined,
      billingLine1: address?.line1 ?? undefined,
      billingLine2: address?.line2 ?? undefined,
      billingCity: address?.city ?? undefined,
      billingState: address?.state ?? undefined,
      billingPostalCode: address?.postal_code ?? undefined,
      billingCountry: address?.country ?? undefined,
    },
    getGrpcApiKey()
  )
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    logger.error({ error: err }, "Webhook signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (userId) {
          // Stripe will follow with customer.subscription.created which fills
          // in price/period fields. Here we just stamp the customer id and
          // status so the user sees a paid state immediately.
          await authService.updateUserSubscription(
            {
              userId,
              subscriptionStatus: "active",
              stripeCustomerId: session.customer as string,
            },
            getGrpcApiKey()
          )
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userResponse = await authService.getUserByStripeCustomerId(
          { stripeCustomerId: customerId },
          getGrpcApiKey()
        )
        if (userResponse.user) {
          await authService.updateUserSubscription(
            {
              userId: userResponse.user.id,
              subscriptionStatus: "cancelled",
              stripeSubscriptionId: subscription.id,
              cancelAtPeriodEnd: false,
            },
            getGrpcApiKey()
          )
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const userResponse = await authService.getUserByStripeCustomerId(
          { stripeCustomerId: customerId },
          getGrpcApiKey()
        )
        if (userResponse.user) {
          await authService.updateUserSubscription(
            {
              userId: userResponse.user.id,
              subscriptionStatus: "past_due",
            },
            getGrpcApiKey()
          )
        }
        break
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        // A successful payment can clear a past_due state. Re-sync from the
        // subscription if one is attached to the invoice.
        const invoice = event.data.object as Stripe.Invoice
        const lineSub = invoice.lines?.data?.[0]?.subscription
        const subId =
          typeof lineSub === "string"
            ? lineSub
            : lineSub && "id" in lineSub
              ? lineSub.id
              : undefined
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId)
          await syncSubscription(subscription)
        }
        break
      }

      case "customer.created":
      case "customer.updated": {
        await syncCustomerProfile(event.data.object as Stripe.Customer)
        break
      }

      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer
        const userId = customer.metadata?.userId
        if (userId) {
          await authService.updateUserSubscription(
            {
              userId,
              subscriptionStatus: "cancelled",
              cancelAtPeriodEnd: false,
            },
            getGrpcApiKey()
          )
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({
      error,
      eventType: event.type,
    }, "Webhook handler error")
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
