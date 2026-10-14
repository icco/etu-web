import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("notes-only download also includes more than 10000 notes", async ({ page }) => {
  await page.request.post("/api/test/auth", { data: { email: "alice-export@example.com" } })
  await page.goto("/settings/account")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export All Notes as JSON" }).click()
  const path = await (await download).path()
  const data = JSON.parse(await readFile(path!, "utf8"))
  expect(data.notes).toHaveLength(10001)
})

test("full export is private and streams every note with media", async ({ request }) => {
  expect((await request.get("/api/account/export")).status()).toBe(401)
  await request.post("/api/test/auth", { data: { email: "alice-export@example.com" } })
  const response = await request.get("/api/account/export")
  expect(response.ok()).toBeTruthy()
  expect(response.headers()["cache-control"]).toContain("no-store")
  const data = await response.json()
  expect(data.items.filter((item: { note?: unknown }) => item.note)).toHaveLength(10001)
  expect(data.items[0].user.email).toBe("alice-export@example.com")
  expect(data.items.find((item: { note?: unknown }) => item.note).note.images[0].url).toBeTruthy()
})

test("deletion requires the current password and ends the session", async ({ page }) => {
  await page.request.post("/api/test/auth", { data: { email: "alice-delete@example.com" } })
  await page.goto("/settings/account")
  await page.getByLabel("Password to delete account").fill("wrongpassword")
  await page.getByLabel("I understand this permanently deletes my account and data").check()
  await page.getByRole("button", { name: "Permanently delete account" }).click()
  await expect(page.getByText("Current password is incorrect")).toBeVisible()
  await page.getByLabel("Password to delete account").fill("testpassword")
  await page.getByRole("button", { name: "Permanently delete account" }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto("/settings/account")
  await expect(page).toHaveURL(/\/login/)
})

test("AI processing is opt-in and the choice persists", async ({ page }) => {
  await page.request.post("/api/test/auth", { data: { email: "alice-ai@example.com" } })
  await page.goto("/settings/account")
  const toggle = page.getByLabel("Enable AI processing")
  await expect(toggle).not.toBeChecked()
  await toggle.check()
  await expect(page.getByText("AI preference updated")).toBeVisible()
  await page.reload()
  await expect(toggle).toBeChecked()
  await toggle.uncheck()
  await expect(page.getByText("AI preference updated")).toBeVisible()
})
