import { expect, test } from "@playwright/test";

test("renders ULGEN shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Unified Resource List")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh Instances" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Terminal" })).toBeVisible();
});
