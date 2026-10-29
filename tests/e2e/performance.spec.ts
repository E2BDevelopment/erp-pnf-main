import { expect, test, type Page } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";

type NavigationMetric = {
  domContentLoaded: number;
  load: number;
  transferSize: number;
};

async function navigationMetric(page: Page): Promise<NavigationMetric> {
  return page.evaluate(() => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
      load: Math.round(entry.loadEventEnd),
      transferSize: entry.transferSize ?? 0,
    };
  });
}

test.describe("presupuestos de rendimiento (entorno local)", () => {
  test("la landing carga dentro del presupuesto", async ({ page }) => {
    const inicio = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const hastaTitulo = Date.now() - inicio;

    const metric = await navigationMetric(page);
    await test.info().attach("landing-performance.json", {
      body: JSON.stringify({ hastaTitulo, ...metric }, null, 2),
      contentType: "application/json",
    });

    expect(hastaTitulo).toBeLessThan(10_000);
    expect(metric.domContentLoaded).toBeLessThan(10_000);
    expect(metric.load).toBeLessThan(20_000);
  });

  test("el dashboard carga dentro del presupuesto", async ({ page }) => {
    const inicio = Date.now();
    await login(page, DEMO_USERS.director);
    const hastaDashboard = Date.now() - inicio;

    const metric = await navigationMetric(page);
    await test.info().attach("dashboard-performance.json", {
      body: JSON.stringify({ hastaDashboard, ...metric }, null, 2),
      contentType: "application/json",
    });

    expect(hastaDashboard).toBeLessThan(30_000);
    expect(metric.domContentLoaded).toBeLessThan(15_000);
  });

  test("no hay desbordamiento horizontal en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const ruta of ["/", "/login"]) {
      await page.goto(ruta);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `Desbordamiento en ${ruta}`).toBeLessThanOrEqual(1);
    }

    await login(page, DEMO_USERS.director);
    const overflowDashboard = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflowDashboard, "Desbordamiento en /app/dashboard").toBeLessThanOrEqual(1);
  });
});
