import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function analizar(page: Page, nombre: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  await test.info().attach(`axe-${nombre}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  const bloqueantes = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  expect(
    bloqueantes,
    bloqueantes
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.length} nodo(s)`,
      )
      .join("\n"),
  ).toEqual([]);

  return results;
}

test.describe("accesibilidad WCAG 2.1 AA", () => {
  test("landing sin violaciones críticas ni serias", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await analizar(page, "landing");
  });

  test("login sin violaciones críticas ni serias", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Iniciar sesión", { exact: true })).toBeVisible();
    await analizar(page, "login");
  });

  /**
   * El contraste de los badges de pendientes se midió en 4.45:1 y 4.2:1 en una
   * corrida intermedia, pero con la carga de datos ya asentada axe no reporta
   * violaciones. Se espera explícitamente el panel para evitar el falso positivo
   * por analizar la página antes de que termine de pintar.
   */
  test("dashboard del director sin violaciones críticas ni serias", async ({ page }) => {
    await login(page, DEMO_USERS.director);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Espera visto bueno", { exact: true })).toBeVisible();
    await analizar(page, "dashboard");
  });
});
