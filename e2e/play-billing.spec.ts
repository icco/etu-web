import { test, expect, type Page } from "@playwright/test"
import { Code } from "@connectrpc/connect"
import { hasPaidAccess } from "../lib/paid-access"
import { assertStripeCheckoutAllowed, PlayManagedError, PLAY_SUBSCRIPTION_URL } from "../lib/play-billing"

const grpcError = (code: Code, details: string) => Object.assign(new Error(details), { code, details })
const subscriptionRequired = () => grpcError(Code.PermissionDenied, "subscription required")

test("play-paid users cannot start Stripe checkout", async () => {
  const paid = async () => true
  await expect(assertStripeCheckoutAllowed({ billingProvider: "play" }, paid)).rejects.toBeInstanceOf(PlayManagedError)
})

test("play-lapsed users can still start Stripe checkout", async () => {
  const lapsed = async () => false
  await expect(assertStripeCheckoutAllowed({ billingProvider: "play" }, lapsed)).resolves.toBeUndefined()
})

test("non-play users skip the paid-access probe", async () => {
  let probes = 0
  const paid = async () => { probes++; return true }
  await assertStripeCheckoutAllowed({ billingProvider: "stripe" }, paid)
  await assertStripeCheckoutAllowed({}, paid)
  expect(probes).toBe(0)
})

test("paid access follows the backend subscription decision", async () => {
  expect(await hasPaidAccess("alice", "key", { listNotes: async () => ({}) as never })).toBe(true)
  expect(await hasPaidAccess("alice", "key", { listNotes: async () => { throw subscriptionRequired() } })).toBe(false)
  await expect(hasPaidAccess("alice", "key", {
    listNotes: async () => { throw grpcError(Code.Unavailable, "boom") },
  })).rejects.toThrow()
})

async function login(page: Page, email: string) {
  const response = await page.request.post("/api/test/auth", { data: { email, password: "testpassword" } })
  expect(response.ok()).toBeTruthy()
}

test("play-paid subscription page links to Google Play and hides Stripe actions", async ({ page }) => {
  await login(page, "alice-play@example.com")
  await page.goto("/settings/subscription")
  await expect(page.getByText("Managed by Google Play")).toBeVisible()
  await expect(page.getByRole("link", { name: "Manage in Google Play" })).toHaveAttribute("href", PLAY_SUBSCRIPTION_URL)
  await expect(page.getByRole("button", { name: "Subscribe" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Manage Subscription" })).toHaveCount(0)
})

test("play-lapsed subscription page offers Stripe checkout", async ({ page }) => {
  await login(page, "alice-play-unpaid@example.com")
  await page.goto("/settings/subscription")
  await expect(page.getByText("Managed by Google Play")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Subscribe" })).toBeVisible()
})
