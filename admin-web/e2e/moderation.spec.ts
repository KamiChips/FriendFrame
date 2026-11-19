import { expect, type Page, test } from "@playwright/test";

// cuentas del modo simulado: cualquier contrasena de 6+ caracteres con correo @friendframe.test
async function signIn(page: Page, email = "admin@friendframe.test") {
  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
}

test("un admin resuelve un reporte de punta a punta", async ({ page }) => {
  await signIn(page);
  await page
    .getByRole("navigation", { name: "Secciones" })
    .getByRole("link", { name: /Reportes/ })
    .click();

  await page.getByRole("combobox", { name: "Tipo" }).click();
  await page.getByRole("option", { name: "Post" }).click();
  await expect(page).toHaveURL(/type=post/);

  await page.getByRole("link", { name: /Abrir reporte de @carlos_dev/ }).click();
  await page.getByRole("button", { name: "Tomar caso" }).click();
  await page.getByRole("radio", { name: "Advertir al autor" }).click();
  await page.getByRole("button", { name: "Enviar advertencia" }).click();

  await expect(page).toHaveURL(/\/reports\?notice=/);
  await expect(page.getByText("Cola actualizada · 3 reportes resueltos")).toBeVisible();
  await expect(page.getByText("Advertencia enviada")).toBeVisible();
});

test("las rutas profundas funcionan al recargar y el tema se recuerda", async ({ page }) => {
  await page.goto("/users/u1?tab=hidden");
  await expect(page.getByRole("heading", { name: "@carlos_dev", level: 1 })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Contenido oculto/ })).toHaveAttribute("data-state", "active");

  const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.getByRole("button", { name: /Cambiar tema/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(dark ? /^(?!.*dark)/ : /dark/);
});

test("un moderador no puede abrir la bitacora", async ({ page }) => {
  await signIn(page, "moderador@friendframe.test");
  await expect(page.getByRole("link", { name: "Bitácora" })).toHaveCount(0);
});
