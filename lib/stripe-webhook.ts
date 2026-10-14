import type Stripe from "stripe"
import type { AuthServiceApi, Timestamp } from "./grpc/client"
import logger from "./logger"

interface WebhookServices {
  stripe: Stripe
  auth: Pick<AuthServiceApi, "getUserByStripeCustomerId" | "updateUserSubscription" | "updateUserStripeCustomer">
  apiKey: string
  webhookSecret: string
}

function resourceId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id
}

function timestamp(seconds: number | undefined): Timestamp | undefined {
  return seconds === undefined ? undefined : { seconds: Math.floor(seconds).toString(), nanos: 0 }
}

export async function handleStripeWebhook(request: Request, services: WebhookServices) {
  const { stripe, auth, apiKey, webhookSecret } = services
  const signature = request.headers.get("stripe-signature")
  if (!signature || !webhookSecret) return Response.json({ error: "Missing signature" }, { status: 400 })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error) {
    logger.warn({ errorType: error instanceof Error ? error.name : "Unknown" }, "Webhook signature verification failed")
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  async function findUser(customerId: string) {
    const { user } = await auth.getUserByStripeCustomerId({ stripeCustomerId: customerId }, apiKey)
    if (!user) {
      logger.warn({ eventId: event.id, customerId }, "Stripe customer has no matching account")
      throw new Error("Unmatched Stripe customer")
    }
    return user
  }

  async function syncSubscription(id: string, expectedCustomer?: string) {
    let subscription = await stripe.subscriptions.retrieve(id)
    const customerId = resourceId(subscription.customer)
    if (!customerId || (expectedCustomer && expectedCustomer !== customerId)) throw new Error("Stripe subscription customer mismatch")
    const user = await findUser(customerId)
    if (subscription.status === "canceled" && user.stripeSubscriptionId && user.stripeSubscriptionId !== id) {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      if (resourceId(subscription.customer) !== customerId) throw new Error("Stripe subscription customer mismatch")
    }
    const item = subscription.items.data[0]
    await auth.updateUserSubscription({
      userId: user.id,
      subscriptionStatus: subscription.status === "trialing" ? "trial" : subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscriptionEnd: timestamp(item?.current_period_end),
      currentPeriodStart: timestamp(item?.current_period_start),
      stripeEventId: event.id,
    }, apiKey)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") break
        const subscriptionId = resourceId(session.subscription)
        const customerId = resourceId(session.customer)
        if (!subscriptionId || !customerId) throw new Error("Checkout subscription or customer missing")
        await syncSubscription(subscriptionId, customerId)
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id)
        break
      case "invoice.payment_failed":
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const id = resourceId(invoice.parent?.subscription_details?.subscription ?? invoice.lines?.data?.[0]?.subscription)
        if (id) await syncSubscription(id)
        break
      }
      case "customer.created":
      case "customer.updated":
      case "customer.deleted": {
        const customer = await stripe.customers.retrieve(event.data.object.id)
        if (!customer.deleted && !customer.metadata?.userId) {
          logger.warn({ eventId: event.id, customerId: customer.id }, "Ignoring Stripe customer without account metadata")
          break
        }
        const user = await findUser(customer.id)
        if (customer.deleted) {
          await auth.updateUserSubscription({ userId: user.id, subscriptionStatus: "canceled", stripeCustomerId: "", cancelAtPeriodEnd: false, stripeEventId: event.id }, apiKey)
        } else {
          const address = customer.address
          await auth.updateUserStripeCustomer({
            userId: user.id,
            name: customer.name ?? "",
            billingLine1: address?.line1 ?? "",
            billingLine2: address?.line2 ?? "",
            billingCity: address?.city ?? "",
            billingState: address?.state ?? "",
            billingPostalCode: address?.postal_code ?? "",
            billingCountry: address?.country ?? "",
            stripeEventId: event.id,
          }, apiKey)
        }
        break
      }
    }
    return Response.json({ received: true })
  } catch (error) {
    logger.error({ error, eventId: event.id, eventType: event.type }, "Webhook handler error")
    return Response.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
