import { test, expect } from "@playwright/test"
import Stripe from "stripe"
import { createSubscriptionCheckout } from "../lib/stripe-checkout"
import type { User } from "../lib/grpc/client"

const user: User = { id: "alice", email: "alice@example.com", subscriptionStatus: "free", hasNotionKey: false, aiEnabled: false, disabled: false, stripeCustomerId: "cus_alice" }

function checkoutFixture(history: { status: string }[] = []) {
  let checkoutBody = new URLSearchParams()
  let creates = 0
  let expires = 0
  const sessions: Record<string, unknown>[] = []
  const stripe = new Stripe("sk_test_fixture", { httpClient: Stripe.createFetchHttpClient(async (input, init) => {
    if (String(input).includes("/subscriptions")) return Response.json({ object: "list", data: history, has_more: false })
    if (init?.method === "GET") return Response.json({ object: "list", data: sessions, has_more: false })
    if (String(input).endsWith("/expire")) {
      expires++
      const session = sessions.find(item => String(input).includes(String(item.id)))!
      session.status = "expired"
      return Response.json(session)
    }
    checkoutBody = new URLSearchParams(String(init?.body))
    creates++
    const session = { id: `cs_alice_${creates}`, url: "https://checkout.stripe.com/c/pay/alice", mode: "subscription", status: "open", metadata: Object.fromEntries([...checkoutBody].filter(([key]) => key.startsWith("metadata[")).map(([key, value]) => [key.slice(9, -1), value])) }
    sessions.unshift(session)
    return Response.json(session)
  }) })
  return { stripe, body: () => checkoutBody, creates: () => creates, expires: () => expires, sessions }
}

test("checkout retries across five-minute boundaries reuse the payable session", async () => {
  const f = checkoutFixture()
  const originalNow = Date.now
  try {
    Date.now = () => 1791936000000
    const first = await createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")
    Date.now = () => 1791936300001
    const second = await createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")
    expect(second.id).toBe(first.id)
    expect(f.creates()).toBe(1)
  } finally {
    Date.now = originalNow
  }
})

test("replacing an outdated checkout expires its payable session", async () => {
  const f = checkoutFixture()
  f.sessions.push({ id: "cs_legacy", status: "open", mode: "subscription", metadata: { userId: "alice" }, url: "https://checkout.stripe.com/c/pay/legacy" })
  await createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")
  expect(f.expires()).toBe(1)
  expect(f.creates()).toBe(1)
})

test("first subscription checkout gives a 14-day trial with a card required", async () => {
  const f = checkoutFixture()
  const result = await createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")
  expect(result.url).toBe("https://checkout.stripe.com/c/pay/alice")
  expect(f.body().get("subscription_data[trial_period_days]")).toBe("14")
  expect(f.body().get("payment_method_collection")).toBe("always")
  expect(f.body().get("allowed_payment_method_types[0]")).toBe("card")
})

test("returning customers do not get another trial", async () => {
  const f = checkoutFixture([{ status: "canceled" }])
  await createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")
  expect(f.body().get("subscription_data[trial_period_days]")).toBeNull()
})

test("existing subscriptions cannot be duplicated by checkout", async () => {
  const f = checkoutFixture([{ status: "past_due" }])
  await expect(createSubscriptionCheckout(f.stripe, user, "price_annual", "https://etu.timeclimbers.com")).rejects.toThrow("Manage your existing subscription")
  expect(f.body().size).toBe(0)
})

test("registration hands off to checkout without granting note access", async ({ page }) => {
  await page.route("**/api/stripe/checkout", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "/settings/subscription?subscription=success" }) }))
  await page.goto("/register")
  await page.getByLabel("Email").fill("alice-signup@example.com")
  await page.getByLabel("Password", { exact: true }).fill("testpassword")
  await page.getByLabel("Confirm Password").fill("testpassword")
  const checkout = page.waitForRequest("**/api/stripe/checkout")
  await page.getByRole("button", { name: "Create Account" }).click()
  await checkout
  await expect(page).toHaveURL(/\/settings\/subscription/)
  await expect(page.getByText("Checkout completed. Your subscription is being confirmed.")).toBeVisible()
  await page.goto("/notes")
  await expect(page).toHaveURL(/\/settings\/subscription$/)
})

test("billing falls back to the portal when a subscription already exists", async ({ page }, testInfo) => {
  await page.request.post("/api/test/auth", {
    data: { email: `alice-unpaid-portal-${testInfo.project.name}-${testInfo.retry}@example.com` },
  })
  await page.route("**/api/stripe/checkout", route => route.fulfill({
    status: 409, contentType: "application/json",
    body: JSON.stringify({ error: "Manage your existing subscription instead of creating another" }),
  }))
  await page.route("**/api/stripe/portal", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ url: "/settings/subscription?subscription=success" }),
  }))
  await page.goto("/settings/subscription")
  const portal = page.waitForRequest("**/api/stripe/portal")
  await page.getByRole("button", { name: "Subscribe" }).click()
  await portal
})
