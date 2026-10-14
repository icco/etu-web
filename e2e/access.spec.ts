import { test, expect, type Page } from "@playwright/test"

async function login(page: Page, email: string) {
  const response = await page.request.post("/api/test/auth", { data: { email, password: "testpassword" } })
  expect(response.ok()).toBeTruthy()
}

test("unpaid users can recover billing and export but cannot read notes", async ({ page }) => {
  await login(page, "alice-unpaid@example.com")
  await page.goto("/notes")
  await expect(page).toHaveURL(/\/settings\/subscription$/)
  await page.goto("/settings/account")
  await expect(page.getByRole("heading", { name: "Profile Information" })).toBeVisible()
  await page.goto("/history")
  await expect(page).toHaveURL(/\/settings\/subscription$/)
})

test("backend grace decision overrides a past-due status", async ({ page }) => {
  await login(page, "alice-expired@example.com")
  await page.goto("/search")
  await expect(page).toHaveURL(/\/settings\/subscription$/)
})

test("password change invalidates other web sessions", async ({ page, browser }) => {
  await login(page, "alice-password@example.com")
  const other = await browser.newContext()
  try {
    const otherPage = await other.newPage()
    await login(otherPage, "alice-password@example.com")
    await page.goto("/settings/account")
    await page.getByRole("button", { name: "Change Password" }).click()
    await page.getByPlaceholder("Enter current password").fill("testpassword")
    await page.getByPlaceholder("Enter new password").fill("newpassword123")
    await page.getByPlaceholder("Confirm new password").fill("newpassword123")
    await page.getByRole("button", { name: "Update Password" }).click()
    await expect(page).toHaveURL(/\/login/)
    await otherPage.goto("/settings/account")
    await expect(otherPage).toHaveURL(/\/login/)
  } finally {
    await other.close()
  }
})
