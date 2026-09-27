import { test, expect } from "@playwright/test";

const runFull =
  process.env.E2E_FULL === "1" && Boolean(process.env.PLAYWRIGHT_API_URL);

test.describe("full journey", () => {
  test.skip(!runFull, "Set E2E_FULL=1 and run API + web to enable");

  test("register → dashboard", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /register/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
