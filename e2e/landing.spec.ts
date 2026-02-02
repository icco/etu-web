import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth to show logged-out state
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      })
    })
  })

  test("displays hero section correctly", async ({ page }) => {
    await page.goto("/")
    // Check for the new badge
    await expect(page.locator("text=The Best Note-Taking App")).toBeVisible()
    await expect(page.locator("h2").first()).toContainText("Your Thoughts")
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible()
    await expect(page).toHaveScreenshot("landing-hero.png")
  })

  test("displays features section", async ({ page }) => {
    await page.goto("/")
    await page.locator("text=How It Works").scrollIntoViewIfNeeded()
    await expect(page.locator("text=Capture Instantly")).toBeVisible()
    await expect(page).toHaveScreenshot("landing-features.png")
  })

  test("displays pricing section", async ({ page }) => {
    await page.goto("/")
    await page.locator("text=Simple, Honest Pricing").scrollIntoViewIfNeeded()
    await expect(page.locator("text=$5")).toBeVisible()
    await expect(page).toHaveScreenshot("landing-pricing.png")
  })

  test("displays why different section", async ({ page }) => {
    await page.goto("/")
    await page.locator("text=Why Etu Is Different").scrollIntoViewIfNeeded()
    await expect(page.locator("text=Why Etu Is Different")).toBeVisible()
    await expect(page).toHaveScreenshot("landing-why-different.png")
  })
})

test.describe("Landing Page (Authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via the login page
    await page.goto("/login")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("testpassword")
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/notes")
  })

  test("shows navigation links when logged in", async ({ page }) => {
    await page.goto("/")
    // Check for app navigation links
    await expect(page.getByRole("link", { name: /notes/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /history/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /search/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /tags/i })).toBeVisible()
    await expect(page).toHaveScreenshot("landing-authenticated.png")
  })
})
