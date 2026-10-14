import { test, expect } from "@playwright/test"
import Stripe from "stripe"
import { createSubscriptionCheckout } from "../lib/stripe-checkout"
import type { User } from "../lib/grpc/client"

const user: User = { id: "alice", email: "alice@example.com", subscriptionStatus: "free", hasNotionKey: false, aiEnabled: false, disabled: false, stripeCustomerId: "cus_alice" }

function checkoutFixture(history: { status: string }[] = []) {
  let checkoutBody = new URLSearchParams()
  const stripe = new Stripe("sk_test_fixture", { httpClient: Stripe.createFetchHttpClient(async (input, init) => {
    if (String(input).includes("/subscriptions")) return Response.json({ object: "list", data: history, has_more: false })
    checkoutBody = new URLSearchParams(String(init?.body))
    return Response.json({ id: "cs_alice", url: "https://checkout.stripe.com/c/pay/alice" })
  }) })
  return { stripe, body: () => checkoutBody }
}

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
