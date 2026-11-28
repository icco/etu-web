import { test, expect } from "@playwright/test"
import { readFile } from "node:fs/promises"

test("account settings link downloads the full export", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("test@example.com")
  await page.getByLabel("Password").fill("testpassword")
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/notes")

  await page.goto("/settings/account")
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("link", { name: "Export Account Data" }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/^etu-account-\d{4}-\d{2}-\d{2}\.json$/)
  const data = JSON.parse(await readFile((await download.path())!, "utf8"))
  expect(data.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(Array.isArray(data.items)).toBe(true)
})
