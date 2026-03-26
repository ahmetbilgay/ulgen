import { expect, test } from "@playwright/test";

test("renders ULGEN shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Simple cloud ops." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Enter workspace" }).click();

  await expect(page.getByRole("heading", { name: "Add a provider" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Add provider" }).first().click();

  await expect(page.getByRole("heading", { name: "Add a provider" }).nth(1)).toBeVisible();
  await expect(page.getByRole("button", { name: /Amazon Web Services/i })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.getByRole("button", { name: "Add provider" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide sidebar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Providers" })).toBeVisible();
});
