import { expect, test } from "@playwright/test";

test("renders ULGEN shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await page.getByRole("button", { name: "Get started" }).click();

  await page.getByPlaceholder("you@company.com").fill("demo@ulgen.dev");
  await page.getByPlaceholder("Your password").fill("password");
  await page.getByRole("button", { name: "Continue to services" }).click();

  await expect(page.getByRole("button", { name: "Amazon Web Services Available" })).toBeVisible();
  await page.getByRole("button", { name: "Amazon Web Services Available" }).click();

  await expect(page.getByRole("button", { name: "Continue without AWS" })).toBeVisible();
  await page.getByRole("button", { name: "Continue without AWS" }).click();

  await expect(page.getByRole("heading", { name: "Operational Workspace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh Instances" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inspector" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Terminal" })).toBeVisible();
});
