import type Stripe from "stripe"
import { Code } from "@connectrpc/connect"
import type { AuthServiceApi, Timestamp } from "./grpc/client"
import logger from "./logger"

interface WebhookServices {
  stripe: Stripe
  auth: Pick<AuthServiceApi, "getUser" | "getUserByStripeCustomerId" | "updateUserSubscription" | "updateUserStripeCustomer">
  apiKey: string
  webhookSecret: string
}

function resourceId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id
}

function timestamp(seconds: number | undefined): Timestamp | undefined {
  return seconds === undefined ? undefined : { seconds: Math.floor(seconds).toString(), nanos: 0 }
}

const SYNC_PASSES = 3

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

  // A deleted Etu account has nothing left to unlink, so acknowledge instead of retrying forever.
  async function getAccount(userId: string) {
    try {
      return (await auth.getUser({ userId }, apiKey)).user
    } catch (error) {
      if ((error as { code?: unknown }).code === Code.NotFound) return undefined
      throw error
    }
  }

  async function resolveSubscription(id: string, expectedCustomer?: string) {
    let subscription = await stripe.subscriptions.retrieve(id)
    const customerId = resourceId(subscription.customer)
    if (!customerId || (expectedCustomer && expectedCustomer !== customerId)) throw new Error("Stripe subscription customer mismatch")
    const user = await findUser(customerId)
    if ((subscription.status === "canceled" || subscription.status === "incomplete_expired") && user.stripeSubscriptionId && user.stripeSubscriptionId !== id) {
      subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      if (resourceId(subscription.customer) !== customerId) throw new Error("Stripe subscription customer mismatch")
    }
    const item = subscription.items.data[0]
    return {
      userId: user.id,
      subscriptionStatus: subscription.status === "trialing" ? "trial" : subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscriptionEnd: timestamp(item?.current_period_end),
      currentPeriodStart: timestamp(item?.current_period_start),
    }
  }

  // Another delivery can commit between our Stripe read and backend write, so re-read after every
  // write and rewrite until Stripe is stable and the stored user matches it.
  async function syncSubscription(id: string, expectedCustomer?: string) {
    let current = await resolveSubscription(id, expectedCustomer)
    for (let pass = 0; pass < SYNC_PASSES; pass++) {
      const { user: stored } = await auth.updateUserSubscription({ ...current, stripeEventId: pass === 0 ? event.id : undefined }, apiKey)
      const latest = await resolveSubscription(id, expectedCustomer)
      const storedMatches = stored.subscriptionStatus === current.subscriptionStatus &&
        stored.stripeSubscriptionId === current.stripeSubscriptionId &&
        stored.stripePriceId === current.stripePriceId &&
        Boolean(stored.cancelAtPeriodEnd) === current.cancelAtPeriodEnd
      if (storedMatches && JSON.stringify(latest) === JSON.stringify(current)) return
      current = latest
    }
    throw new Error("Stripe subscription changed during every sync pass")
  }

  async function resolveProfile(id: string) {
    const customer = await stripe.customers.retrieve(id)
    if (customer.deleted) return undefined
    const address = customer.address
    return {
      metadataUserId: customer.metadata?.userId,
      name: customer.name ?? "",
      billingLine1: address?.line1 ?? "",
      billingLine2: address?.line2 ?? "",
      billingCity: address?.city ?? "",
      billingState: address?.state ?? "",
      billingPostalCode: address?.postal_code ?? "",
      billingCountry: address?.country ?? "",
    }
  }

  async function syncProfile(id: string) {
    let current = await resolveProfile(id)
    if (!current) return
    if (!current.metadataUserId) {
      logger.warn({ eventId: event.id, customerId: id }, "Ignoring Stripe customer without account metadata")
      return
    }
    const user = await findUser(id)
    for (let pass = 0; pass < SYNC_PASSES; pass++) {
      const { metadataUserId: _metadataUserId, ...profile } = current
      const { user: stored } = await auth.updateUserStripeCustomer({ userId: user.id, ...profile, stripeEventId: pass === 0 ? event.id : undefined }, apiKey)
      const latest = await resolveProfile(id)
      if (!latest) return
      const storedMatches = (Object.keys(profile) as (keyof typeof profile)[]).every((key) => (stored[key] ?? "") === profile[key])
      if (storedMatches && JSON.stringify(latest) === JSON.stringify(current)) return
      current = latest
    }
    throw new Error("Stripe customer changed during every sync pass")
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
        await syncProfile(event.data.object.id)
        break
      case "customer.deleted": {
        // The deletion payload is the only place the account link survives; a refetch returns only {id, deleted}.
        const customer = event.data.object as Stripe.Customer
        const userId = customer.metadata?.userId
        const user = userId ? await getAccount(userId) : await findUser(customer.id)
        if (!user || user.stripeCustomerId !== customer.id) {
          logger.info({ eventId: event.id, customerId: customer.id }, "Stripe customer already unlinked")
          break
        }
        await auth.updateUserSubscription({ userId: user.id, subscriptionStatus: "canceled", stripeCustomerId: "", cancelAtPeriodEnd: false, stripeEventId: event.id }, apiKey)
        break
      }
    }
    return Response.json({ received: true })
  } catch (error) {
    logger.error({ error, eventId: event.id, eventType: event.type }, "Webhook handler error")
    return Response.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
