import { test, expect } from "@playwright/test"
import Stripe from "stripe"
import { handleStripeWebhook } from "../lib/stripe-webhook"
import type { AuthServiceApi, User } from "../lib/grpc/client"
import { fromBinary, fromJson, toBinary, toJson } from "@bufbuild/protobuf"

test("published protobuf preserves event IDs over the wire", async () => {
  const { UpdateUserSubscriptionRequestSchema, UpdateUserStripeCustomerRequestSchema } = await import("@icco/etu-proto")
  for (const schema of [UpdateUserSubscriptionRequestSchema, UpdateUserStripeCustomerRequestSchema]) {
    const message = fromJson(schema, { userId: "alice", stripeEventId: "evt_alice" })
    expect(toJson(schema, fromBinary(schema, toBinary(schema, message)))).toMatchObject({ stripeEventId: "evt_alice" })
  }
})

const secret = "whsec_fixture_only"
const user: User = { id: "alice", email: "alice@example.com", subscriptionStatus: "free", hasNotionKey: false, aiEnabled: false, disabled: false }

function fixture(status = "trialing", unmatched = false) {
  const updates: Record<string, unknown>[] = []
  const lookups: string[] = []
  const stripe = new Stripe("sk_test_fixture", {
    httpClient: Stripe.createFetchHttpClient(async (input) => {
      const url = String(input)
      lookups.push(url)
      if (url.includes("/subscriptions/")) return Response.json({
        id: "sub_alice", object: "subscription", customer: "cus_alice", status,
        cancel_at_period_end: false, items: { data: [{ current_period_start: 1791936000, current_period_end: 1793145600, price: { id: "price_annual" } }] },
      })
      return Response.json({ id: "cus_alice", object: "customer", metadata: { userId: "alice" }, name: "Ada Lovelace", address: null })
    }),
  })
  const auth = {
    getUserByStripeCustomerId: async () => ({ user: unmatched ? undefined : user }),
    updateUserSubscription: async (request: Record<string, unknown>) => { updates.push(request); return { user } },
    updateUserStripeCustomer: async (request: Record<string, unknown>) => { updates.push(request); return { user } },
  } as Pick<AuthServiceApi, "getUserByStripeCustomerId" | "updateUserSubscription" | "updateUserStripeCustomer">
  async function send(type: string, object: object, signature = true) {
    const payload = JSON.stringify({ id: "evt_alice", object: "event", type, data: { object } })
    const signed = stripe.webhooks.generateTestHeaderString({ payload, secret })
    return handleStripeWebhook(new Request("http://localhost/api/stripe/webhook", {
      method: "POST", body: payload, headers: { "stripe-signature": signature ? signed : "invalid" },
    }), { stripe, auth, apiKey: "fixture-service-key", webhookSecret: secret })
  }
  return { send, updates, lookups }
}

test("signed subscription events use current Stripe state and carry durable event ID", async () => {
  const f = fixture("active")
  const result = await f.send("customer.subscription.updated", { id: "sub_alice", customer: "cus_alice", status: "past_due" })
  expect(result.status).toBe(200)
  expect(f.lookups.some(url => url.includes("/subscriptions/sub_alice"))).toBeTruthy()
  expect(f.updates).toMatchObject([{ subscriptionStatus: "active", stripeEventId: "evt_alice", stripeSubscriptionId: "sub_alice" }])
})

test("checkout trial stays trial and unpaid checkout never grants access", async () => {
  const f = fixture()
  await f.send("checkout.session.completed", { customer: "cus_alice", subscription: "sub_alice", payment_status: "unpaid", metadata: { userId: "alice" } })
  expect(f.updates).toHaveLength(0)
  const result = await f.send("checkout.session.completed", { customer: "cus_alice", subscription: "sub_alice", payment_status: "no_payment_required", metadata: { userId: "alice" } })
  expect(result.status).toBe(200)
  expect(f.updates).toMatchObject([{ subscriptionStatus: "trial" }])
})

test("invalid signatures do not read Stripe or mutate billing", async () => {
  const f = fixture()
  expect((await f.send("customer.subscription.updated", { id: "sub_alice" }, false)).status).toBe(400)
  expect(f.updates).toHaveLength(0)
  expect(f.lookups).toHaveLength(0)
})

test("unmatched subscription returns retryable failure", async () => {
  const f = fixture("active", true)
  expect((await f.send("customer.subscription.created", { id: "sub_alice" })).status).toBe(500)
  expect(f.updates).toHaveLength(0)
})

test("late failed invoice does not regress a recovered subscription", async () => {
  const f = fixture("active")
  await f.send("invoice.payment_failed", { customer: "cus_alice", parent: { subscription_details: { subscription: "sub_alice" } } })
  expect(f.updates).toMatchObject([{ subscriptionStatus: "active" }])
})
