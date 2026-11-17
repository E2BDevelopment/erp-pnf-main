import { expect, test } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";
import { DEMO_OBRAS } from "../helpers/env";

for (const width of [1440, 360]) {
  test(`aplicar una fecha a todos los insumos del carrito a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page, DEMO_USERS.director);
    await page.goto(`/app/obras/${DEMO_OBRAS.ampliacion}/requisiciones`);
    await page.getByRole("button", { name: "Nueva", exact: true }).click();
    const catalogo = page.getByRole("region", { name: "Catálogo de insumos" });
    await catalogo.getByRole("button", { name: "Agregar", exact: true }).first().click();
    await catalogo.getByRole("button", { name: "Agregar", exact: true }).first().click();
    if (width < 768) {
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
    }

    const carrito = page.getByRole("region", { name: "Carrito de insumos" });
    if (width >= 768) {
      await carrito.locator('button[aria-expanded="false"]:not([aria-haspopup])').first().click();
    }
    const cantidad = carrito.getByLabel("Cantidad (obligatoria)", { exact: true });
    await cantidad.fill("5");
    await carrito.locator("textarea").fill("Conservar esta nota");
    await carrito.getByRole("button", { name: "Selecciona", exact: true }).click();
    await page.getByRole("grid").locator("button:not([disabled])").nth(1).click();
    const fechaAnterior = await carrito.getByRole("button", { name: /^\d{2}\/\d{2}\/\d{4}$/ }).innerText();

    await carrito.getByRole("button", { name: "Misma fecha para todos", exact: true }).click();
    await page.getByRole("grid").locator("button:not([disabled])").first().click();
    const fechaComun = await carrito.getByRole("button", { name: /^\d{2}\/\d{2}\/\d{4}$/ }).innerText();
    expect(fechaComun).not.toBe(fechaAnterior);
    await expect(cantidad).toHaveValue("5");
    await expect(carrito.locator("textarea")).toHaveValue("Conservar esta nota");
    await expect(carrito.getByText("Datos completos", { exact: true })).toHaveCount(1);
    await expect(carrito.getByText("Falta cantidad", { exact: true })).toHaveCount(1);

    await carrito.locator('button[aria-expanded="false"]:not([aria-haspopup])').click();
    await expect(carrito.getByRole("button", { name: /^\d{2}\/\d{2}\/\d{4}$/ })).toHaveText(fechaComun);
    await cantidad.fill("7");
    await expect(carrito.getByText("Datos completos", { exact: true })).toHaveCount(2);
    await expect(carrito.locator(".bg-emerald-50")).toHaveCount(2);
    await page.screenshot({ path: test.info().outputPath(`fecha-comun-${width}.png`) });
  });
}
