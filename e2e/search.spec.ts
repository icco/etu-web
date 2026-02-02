import { test, expect } from "@playwright/test"

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via the login page (mock mode accepts any credentials)
    await page.goto("/login")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("testpassword")
    await page.getByRole("button", { name: "Sign In" }).click()

    // Wait for redirect to notes page
    await page.waitForURL("/notes")

    // Navigate to search page
    await page.goto("/search")
  })

  test("displays search heading", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveScreenshot("search-heading.png")
  })

  test("displays empty state when no query", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })

    // Check for empty state message
    await expect(page.locator("text=Search your blips")).toBeVisible()
    await expect(page).toHaveScreenshot("search-empty.png")
  })

  test("has search input in header", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })

    // Check for search input
    await expect(page.locator('input[name="q"]')).toBeVisible()
  })

  test("displays results when searching", async ({ page }) => {
    // Navigate with a search query that matches mock data
    await page.goto("/search?q=ideas")

    // Wait for results
    await expect(page.locator("text=result").first()).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveScreenshot("search-results.png")
  })

  test("displays no results message for non-matching query", async ({ page }) => {
    // Navigate with a query that won't match
    await page.goto("/search?q=xyznonexistent123")

    // Wait for no results message
    await expect(page.locator("text=No matching blips")).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveScreenshot("search-no-results.png")
  })

  test("has navigation links", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })

    // Check for nav links
    await expect(page.getByRole("link", { name: /notes/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /history/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /tags/i })).toBeVisible()
  })

  test("has FAB for new note", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })

    const fabButton = page.locator(".fab button")
    await expect(fabButton).toBeVisible()
  })

  test("search form submits correctly", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: "Search" })).toBeVisible({ timeout: 10000 })

    // Fill search input and submit
    await page.locator('input[name="q"]').first().fill("test query")
    await page.locator('input[name="q"]').first().press("Enter")

    // Should navigate to search page with query
    await expect(page).toHaveURL(/\/search\?q=test\+query/)
  })
})
