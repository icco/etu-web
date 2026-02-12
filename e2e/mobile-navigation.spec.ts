import { test, expect } from "@playwright/test"

test.describe("Mobile Navigation", () => {
  // Skip tests on desktop - user menu dropdown is optimized for mobile too
  test.skip(({ viewport }) => {
    return viewport !== null && viewport.width >= 768
  }, "Testing navigation on mobile viewports")

  test.beforeEach(async ({ page }) => {
    // Authenticate via the login page
    await page.goto("/login")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("testpassword")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/notes")
  })

  test("user menu button is visible on notes page", async ({ page }) => {
    await page.goto("/notes")

    // Check that the user menu button is visible
    const userMenuButton = page.getByRole("button", { name: "Open user menu" })
    await expect(userMenuButton).toBeVisible()
  })

  test("can navigate to /history from notes page using user menu", async ({ page }) => {
    await page.goto("/notes")

    // Click the user menu button
    await page.getByRole("button", { name: "Open user menu" }).click()

    // Wait for dropdown to appear and click History link
    await page.getByRole("link", { name: /history/i }).first().click()

    // Verify we navigated to /history
    await expect(page).toHaveURL("/history")
  })

  test("user menu shows all navigation options", async ({ page }) => {
    await page.goto("/notes")

    // Click the user menu button
    await page.getByRole("button", { name: "Open user menu" }).click()

    // Check all navigation links are visible in the menu
    await expect(page.getByRole("link", { name: /^notes$/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /^history$/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /^search$/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /^tags$/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /settings/i }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible()
  })

  test("user menu works on /history page", async ({ page }) => {
    await page.goto("/history")

    // Click the user menu button
    await page.getByRole("button", { name: "Open user menu" }).click()

    // Navigate to Search
    await page.getByRole("link", { name: /^search$/i }).first().click()
    await expect(page).toHaveURL("/search")
  })
})
