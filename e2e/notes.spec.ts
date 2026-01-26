import { test, expect } from "@playwright/test"

test.describe("Notes Page", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate via the login page (mock mode accepts any credentials)
    await page.goto("/login")
    await page.getByLabel("Email").fill("test@example.com")
    await page.getByLabel("Password").fill("testpassword")
    await page.getByRole("button", { name: "Sign In" }).click()

    // Wait for redirect to notes page
    await page.waitForURL("/notes")
  })

  test("displays notes list with mocked data", async ({ page }) => {
    // Wait for notes to load (mock data includes "ideas" tag)
    await expect(page.locator("text=ideas")).toBeVisible({ timeout: 10000 })

    // Verify mock notes are displayed
    await expect(page.locator("text=projects")).toBeVisible()
    await expect(page.locator("text=work")).toBeVisible()
    await expect(page).toHaveScreenshot("notes-list.png")
  })

  test("displays note content", async ({ page }) => {
    await expect(page.locator("text=ideas")).toBeVisible({ timeout: 10000 })

    // Check for actual note content from mock data
    await expect(page.locator("text=building")).toBeVisible()
    await expect(page).toHaveScreenshot("notes-content.png")
  })

  test("search filters notes", async ({ page }) => {
    await expect(page.locator("text=ideas")).toBeVisible({ timeout: 10000 })

    // Look for search input (may be in a toggle)
    const searchToggle = page.locator("[aria-label*='search' i], button:has-text('Search')")
    if (await searchToggle.isVisible()) {
      await searchToggle.click()
    }

    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill("meeting")
    await searchInput.press("Enter")

    // Wait for filtered results
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot("notes-search.png")
  })

  test("new note dialog opens", async ({ page }) => {
    await expect(page.locator("text=ideas")).toBeVisible({ timeout: 10000 })

    // Find and click the new note button
    const newNoteButton = page.getByRole("button", { name: /new|add|create|\+/i })
    await expect(newNoteButton).toBeVisible()
    await newNoteButton.click()

    // Wait for dialog
    await page.waitForSelector("[role=dialog]", { timeout: 5000 })
    await expect(page).toHaveScreenshot("notes-new-dialog.png")
  })
})
