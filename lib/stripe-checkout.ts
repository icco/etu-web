import type Stripe from "stripe"
import type { User } from "./grpc/client"

export class ExistingSubscriptionError extends Error {}

export async function createSubscriptionCheckout(stripe: Stripe, user: User, priceId: string, authUrl: string) {
  if (!user.stripeCustomerId) throw new Error("Stripe customer is required")
  let hasHistory = false
  for await (const subscription of stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "all", limit: 100 })) {
    hasHistory = true
    if (subscription.status !== "canceled" && subscription.status !== "incomplete_expired") {
      throw new ExistingSubscriptionError("Manage your existing subscription instead of creating another")
    }
  }
  return stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    allowed_payment_method_types: ["card"],
    payment_method_collection: "always",
    subscription_data: hasHistory ? undefined : { trial_period_days: 14 },
    billing_address_collection: "required",
    customer_update: { name: "auto", address: "auto" },
    success_url: `${authUrl}/settings/subscription?subscription=success`,
    cancel_url: `${authUrl}/settings/subscription?subscription=canceled`,
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message: `I agree to the [Terms of Service](${authUrl}/terms), [Privacy Policy](${authUrl}/privacy), and [Refund Policy](${authUrl}/refunds).`,
      },
    },
    metadata: { userId: user.id },
  }, { idempotencyKey: `etu-checkout-${user.id}-${Math.floor(Date.now() / 300000)}` })
}
