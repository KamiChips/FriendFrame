import { expect, type Page, test } from "@playwright/test";

// cuentas del modo simulado: cualquier contrasena de 6+ caracteres con correo @friendframe.test
async function signIn(page: Page, email = "admin@friendframe.test") {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("clave-de-prueba");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
}

test("un admin resuelve un reporte de punta a punta", async ({ page }) => {
  await signIn(page);
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: /Reports/ })
    .click();

  await page.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: "Post" }).click();
  await expect(page).toHaveURL(/type=post/);

  await page.getByRole("link", { name: /Open report from @carlos_dev/ }).click();
  await page.getByRole("button", { name: "Take case" }).click();
  await page.getByRole("radio", { name: "Warn author" }).click();
  await page.getByRole("button", { name: "Send warning" }).click();

  await expect(page).toHaveURL(/\/reports\?notice=/);
  await expect(page.getByText("Queue updated · 3 reports resolved")).toBeVisible();
  await expect(page.getByText("Warning sent")).toBeVisible();
});

test("las rutas profundas funcionan al recargar y el tema se recuerda", async ({ page }) => {
  await page.goto("/users/u1?tab=hidden");
  await expect(page.getByRole("heading", { name: "@carlos_dev", level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Hidden content/ })).toHaveAttribute("data-state", "active");

  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.getByRole("button", { name: /Change theme/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(dark ? /^(?!.*dark)/ : /dark/);
});

test("un moderador no puede abrir la bitacora", async ({ page }) => {
  await signIn(page, "moderator@friendframe.test");
  await expect(page.getByRole("link", { name: "Audit log" })).toHaveCount(0);
});
