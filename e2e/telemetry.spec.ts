import { test, expect } from "@playwright/test"
import { randomUUID } from "node:crypto"

test("public metadata and sitemap use production URLs", async ({ page, request }) => {
  await page.goto("/")
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Etu/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary")
  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).toContain("https://etu.timeclimbers.com/pricing")
  expect(await sitemap.text()).not.toContain("/notes")
  const robots = await request.get("/robots.txt")
  expect(await robots.text()).toContain("Disallow: /api/")
  expect(await robots.text()).toContain("Sitemap: https://etu.timeclimbers.com/sitemap.xml")
})

test("funnel navigation sends counts without query strings", async ({ page }) => {
  const events: unknown[] = []
  await page.route("**/api/telemetry", async (route) => {
    events.push(route.request().postDataJSON())
    await route.fulfill({ status: 204 })
  })
  await page.goto("/?email=alice@example.com")
  await expect.poll(() => events).toEqual([{ type: "funnel", event: "landing_view" }])
  await page.getByRole("link", { name: "Start Free for 14 Days" }).click()
  await expect.poll(() => events).toEqual([
    { type: "funnel", event: "landing_view" },
    { type: "funnel", event: "register_view" },
  ])
})

test("browser errors omit private details and deduplicate reports", async ({ page }) => {
  const events: unknown[] = []
  await page.route("**/api/telemetry", async (route) => {
    const body = route.request().postDataJSON()
    if (body.type === "error") events.push(body)
    await route.fulfill({ status: 204 })
  })
  await page.goto("/pricing?token=secret")
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) {
      window.dispatchEvent(new ErrorEvent("error", { message: "private note alice@example.com", filename: "https://example.com/?token=secret" }))
    }
    window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: Promise.resolve(), reason: "private note" }))
  })
  await expect.poll(() => events).toEqual([
    { type: "error", kind: "uncaught", route: "/pricing" },
    { type: "error", kind: "unhandled_rejection", route: "/pricing" },
  ])
})

test("telemetry ingestion rejects untrusted and oversized payloads", async ({ request, baseURL }) => {
  const post = (data: unknown, origin = baseURL!) => request.post("/api/telemetry", { data, headers: { origin } })
  expect((await post({ type: "error", kind: "uncaught", route: "/pricing" })).status()).toBe(204)
  expect((await post({ type: "funnel", event: "pricing_view" })).status()).toBe(204)
  expect((await post({ type: "funnel", event: "registration_success" })).status()).toBe(400)
  expect((await post({ type: "error", kind: "uncaught", route: "/notes/private-id" })).status()).toBe(400)
  expect((await post({ type: "error", kind: "uncaught", route: "/pricing", message: "private" })).status()).toBe(400)
  expect((await post({ type: "funnel", event: "pricing_view" }, "https://example.com")).status()).toBe(403)
  expect((await post("a".repeat(2048))).status()).toBe(413)
})

test("successful registration counts one registration_success", async ({ page }) => {
  await page.route("**/api/stripe/checkout", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "/settings/subscription?subscription=success" }) }))
  const email = `alice-signup-funnel-${randomUUID()}@example.com`
  await page.goto("/register")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill("testpassword")
  await page.getByLabel("Confirm Password").fill("testpassword")
  await page.getByRole("button", { name: "Create Account" }).click()
  await expect(page).toHaveURL(/\/settings\/subscription/)
  const { events } = await (await page.request.get("/api/test/telemetry")).json() as { events: { event: string; key?: string }[] }
  expect(events.filter(recorded => recorded.key === email)).toEqual([{ event: "registration_success", key: email }])
})
