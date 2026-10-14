import { test, expect } from "@playwright/test"
import Stripe from "stripe"
import { handleStripeWebhook } from "../lib/stripe-webhook"
import type { AuthServiceApi, User } from "../lib/grpc/client"
import { fromBinary, fromJson, toBinary, toJson } from "@bufbuild/protobuf"
import { Code } from "@connectrpc/connect"

test("published protobuf preserves event IDs over the wire", async () => {
  const { UpdateUserSubscriptionRequestSchema, UpdateUserStripeCustomerRequestSchema } = await import("@icco/etu-proto")
  for (const schema of [UpdateUserSubscriptionRequestSchema, UpdateUserStripeCustomerRequestSchema]) {
    const message = fromJson(schema, { userId: "alice", stripeEventId: "evt_alice" })
    expect(toJson(schema, fromBinary(schema, toBinary(schema, message)))).toMatchObject({ stripeEventId: "evt_alice" })
  }
})

const secret = "whsec_fixture_only"

interface FixtureOptions {
  subscriptions?: Record<string, string | string[]>
  customerNames?: string[]
  seenEventIds?: string[]
  user?: Partial<User> | null
}

function fixture(status = "trialing", unmatched = false, options: FixtureOptions = {}) {
  const updates: Record<string, unknown>[] = []
  const writes: Record<string, unknown>[] = []
  const lookups: string[] = []
  const seen = new Set(options.seenEventIds)
  const reads: Record<string, number> = {}
  // Each Stripe read advances through the sequence, so later reads see what a concurrent writer changed.
  const next = (key: string, values: string | string[]) => {
    if (typeof values === "string") return values
    const index = Math.min(reads[key] ?? 0, values.length - 1)
    reads[key] = (reads[key] ?? 0) + 1
    return values[index]
  }
  let state: User | undefined = options.user === null || unmatched ? undefined : {
    id: "alice", email: "alice@example.com", subscriptionStatus: "free", hasNotionKey: false, aiEnabled: false, disabled: false,
    stripeCustomerId: "cus_alice", ...options.user,
  }
  const stripe = new Stripe("sk_test_fixture", {
    httpClient: Stripe.createFetchHttpClient(async (input) => {
      const url = String(input)
      lookups.push(url)
      const subscription = url.match(/\/subscriptions\/([^/?]+)/)?.[1]
      if (subscription) return Response.json({
        id: subscription, object: "subscription", customer: "cus_alice", status: next(subscription, options.subscriptions?.[subscription] ?? status),
        cancel_at_period_end: false, items: { data: [{ current_period_start: 1791936000, current_period_end: 1793145600, price: { id: "price_annual" } }] },
      })
      if (url.includes("/customers/cus_gone")) return Response.json({ id: "cus_gone", object: "customer", deleted: true })
      return Response.json({ id: "cus_alice", object: "customer", metadata: { userId: "alice" }, name: next("customer", options.customerNames ?? "Ada Lovelace"), address: null })
    }),
  })
  // Mirrors backend event-ID deduplication: a seen ID returns the stored user without applying the update.
  function apply(request: Record<string, unknown>) {
    writes.push(request)
    const id = request.stripeEventId as string | undefined
    if (id && seen.has(id)) return { user: state! }
    if (id) seen.add(id)
    updates.push(request)
    state = { ...state!, ...request } as User
    return { user: state }
  }
  const auth = {
    getUser: async ({ userId }: { userId: string }) => {
      if (!state || state.id !== userId) throw Object.assign(new Error("user not found"), { code: Code.NotFound })
      return { user: state }
    },
    getUserByStripeCustomerId: async ({ stripeCustomerId }: { stripeCustomerId: string }) =>
      ({ user: state && state.stripeCustomerId === stripeCustomerId ? state : undefined }),
    updateUserSubscription: async (request: Record<string, unknown>) => apply(request),
    updateUserStripeCustomer: async (request: Record<string, unknown>) => apply(request),
  } as unknown as Pick<AuthServiceApi, "getUser" | "getUserByStripeCustomerId" | "updateUserSubscription" | "updateUserStripeCustomer">
  async function send(type: string, object: object, signature = true) {
    const payload = JSON.stringify({ id: "evt_alice", object: "event", type, data: { object } })
    const signed = stripe.webhooks.generateTestHeaderString({ payload, secret })
    return handleStripeWebhook(new Request("http://localhost/api/stripe/webhook", {
      method: "POST", body: payload, headers: { "stripe-signature": signature ? signed : "invalid" },
    }), { stripe, auth, apiKey: "fixture-service-key", webhookSecret: secret })
  }
  return { send, updates, writes, lookups, state: () => state }
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

test("late event for an expired subscription keeps the active replacement", async () => {
  const f = fixture("active", false, {
    user: { stripeSubscriptionId: "sub_replacement", subscriptionStatus: "active" },
    subscriptions: { sub_expired: "incomplete_expired", sub_replacement: "active" },
  })
  expect((await f.send("customer.subscription.updated", { id: "sub_expired" })).status).toBe(200)
  expect(f.updates).toMatchObject([{ subscriptionStatus: "active", stripeSubscriptionId: "sub_replacement" }])
})

test("repeated customer deletion is acknowledged without another update", async () => {
  const f = fixture()
  const deleted = { id: "cus_alice", object: "customer", deleted: true, metadata: { userId: "alice" } }
  expect((await f.send("customer.deleted", deleted)).status).toBe(200)
  expect(f.updates).toMatchObject([{ userId: "alice", subscriptionStatus: "canceled", stripeCustomerId: "" }])
  expect((await f.send("customer.deleted", deleted)).status).toBe(200)
  expect(f.updates).toHaveLength(1)
})

test("deleting an old customer never unlinks a replacement customer", async () => {
  const f = fixture("active", false, { user: { stripeCustomerId: "cus_replacement", subscriptionStatus: "active" } })
  const deleted = { id: "cus_alice", object: "customer", deleted: true, metadata: { userId: "alice" } }
  expect((await f.send("customer.deleted", deleted)).status).toBe(200)
  expect(f.updates).toHaveLength(0)
})

test("customer deletion after the Etu account is gone is acknowledged", async () => {
  const f = fixture("active", false, { user: null })
  const deleted = { id: "cus_alice", object: "customer", deleted: true, metadata: { userId: "alice" } }
  expect((await f.send("customer.deleted", deleted)).status).toBe(200)
  expect(f.updates).toHaveLength(0)
})

test("a cancellation committed between read and write is corrected before acknowledging", async () => {
  const f = fixture("active", false, { subscriptions: { sub_alice: ["active", "canceled"] } })
  expect((await f.send("customer.subscription.updated", { id: "sub_alice" })).status).toBe(200)
  expect(f.updates).toMatchObject([
    { subscriptionStatus: "active", stripeEventId: "evt_alice" },
    { subscriptionStatus: "canceled" },
  ])
  expect(f.updates[1].stripeEventId).toBeUndefined()
  expect(f.state()?.subscriptionStatus).toBe("canceled")
})

test("a deduplicated retry still repairs data left stale by an earlier delivery", async () => {
  const f = fixture("canceled", false, {
    seenEventIds: ["evt_alice"],
    user: { subscriptionStatus: "active", stripeSubscriptionId: "sub_alice" },
  })
  expect((await f.send("customer.subscription.updated", { id: "sub_alice" })).status).toBe(200)
  expect(f.state()?.subscriptionStatus).toBe("canceled")
})

test("a subscription that keeps changing fails retryably instead of acknowledging stale data", async () => {
  const f = fixture("active", false, { subscriptions: { sub_alice: ["active", "canceled", "active", "canceled", "active", "canceled", "active"] } })
  expect((await f.send("customer.subscription.updated", { id: "sub_alice" })).status).toBe(500)
})

test("a profile change committed between read and write is corrected", async () => {
  const f = fixture("active", false, { customerNames: ["Ada Lovelace", "Ada King"] })
  expect((await f.send("customer.updated", { id: "cus_alice" })).status).toBe(200)
  expect(f.state()?.name).toBe("Ada King")
})

test("a deduplicated profile retry still repairs a stale stored name", async () => {
  const f = fixture("active", false, { seenEventIds: ["evt_alice"], customerNames: ["Ada King"], user: { name: "Ada Lovelace" } })
  expect((await f.send("customer.updated", { id: "cus_alice" })).status).toBe(200)
  expect(f.state()?.name).toBe("Ada King")
})
