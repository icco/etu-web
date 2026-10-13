import { test, expect } from "@playwright/test"

const pages = [
  { link: "Pricing", path: "/pricing", heading: "Pricing" },
  { link: "Terms", path: "/terms", heading: "Terms of Service" },
  { link: "Privacy", path: "/privacy", heading: "Privacy Policy" },
  { link: "Refunds", path: "/refunds", heading: "Refund Policy" },
]

test.describe("Legal links", () => {
  for (const { link, path, heading } of pages) {
    test(`footer ${link} link opens ${path}`, async ({ page }) => {
      await page.goto("/")
      await page.getByRole("navigation", { name: "Legal" }).getByRole("link", { name: link }).click()
      await expect(page).toHaveURL(path)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading)
    })
  }

  test("privacy policy discloses Vertex AI processing", async ({ page }) => {
    await page.goto("/privacy")
    await expect(page.getByText(/Google Cloud Vertex AI/)).toBeVisible()
  })
})
