import { expect, test } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";
import { adminClient, signInDemo } from "../helpers/supabase";

test("el Director configura excepciones por obra y el servidor las aplica", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(90_000);
  const admin = adminClient();
  const resident = await signInDemo(DEMO_USERS.residente);
  const obraIds: string[] = [];
  try {
    const { data: obras, error } = await admin
      .from("obras")
      .insert([
        { company_id: resident.companyId!, nombre: "Permisos QA A" },
        { company_id: resident.companyId!, nombre: "Permisos QA B" },
      ])
      .select("id");
    if (error) throw error;
    obraIds.push(...obras!.map((obra) => obra.id));
    const { error: teamError } = await admin.from("obra_team").insert(
      obraIds.map((obra_id) => ({
        obra_id,
        user_id: resident.userId,
        role: "residente" as const,
      })),
    );
    if (teamError) throw teamError;
    await login(page, DEMO_USERS.director);
    await page.goto(`/app/obras/${obraIds[0]}/configuracion`);
    await page.getByRole("tab", { name: "Permisos", exact: true }).click();
    await page.getByRole("textbox", { name: "Buscar permisos" }).fill("Crear requisición");
    const select = page.getByRole("combobox", {
      name: "Residente — Crear requisición",
      exact: true,
    });
    await expect(select).toContainText("Heredar");
    await select.click();
    await page.getByRole("option", { name: "Denegar", exact: true }).click();
    await expect(select).toBeEnabled();
    await expect(select).toContainText("Denegar");
    await page.screenshot({ path: testInfo.outputPath("permisos-obra-desktop.png") });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: testInfo.outputPath("permisos-obra-mobile.png") });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.reload();
    await page.getByRole("tab", { name: "Permisos", exact: true }).click();
    await page.getByRole("textbox", { name: "Buscar permisos" }).fill("Crear requisición");
    await expect(select).toContainText("Denegar");

    const rpc = async (fn: string, data: unknown) => {
      const response = await page.request.post(`/api/rpc/${encodeURIComponent(`api/${fn}`)}`, {
        headers: { authorization: `Bearer ${resident.token}` },
        data: { data },
      });
      return response.json();
    };
    const denied = await rpc("requisiciones.functions.guardarBorradorRequisicion", {
      obraId: obraIds[0],
      insumos: [],
    });
    expect(denied.ok).toBe(false);
    expect(denied.error).toContain("No tienes permiso");
    const first = await rpc("permisos.functions.listRolePermissions", { obraId: obraIds[0] });
    const second = await rpc("permisos.functions.listRolePermissions", { obraId: obraIds[1] });
    expect(first.data.obra_items).toContainEqual({
      role: "residente",
      action_key: "requisiciones.crear",
      allowed: false,
    });
    expect(second.data.obra_items).toEqual([]);
    const forbidden = await rpc("permisos.functions.setRolePermission", {
      obraId: obraIds[0],
      role: "residente",
      action_key: "requisiciones.crear",
      allowed: true,
    });
    expect(forbidden.ok).toBe(false);
    expect(forbidden.error).toContain("Solo el Director");

    await select.click();
    await page.getByRole("option", { name: /Heredar/ }).click();
    await expect(select).toBeEnabled();
    await expect(select).toContainText("Heredar");
    const restored = await rpc("permisos.functions.listRolePermissions", { obraId: obraIds[0] });
    expect(restored.data.obra_items).toEqual([]);

    const { error: visibilityError } = await admin.from("obra_role_permissions").insert({
      company_id: resident.companyId!,
      obra_id: obraIds[0],
      role: "residente",
      action_key: "requisiciones.ver",
      allowed: false,
    });
    if (visibilityError) throw visibilityError;
    const context = await browser.newContext();
    try {
      const residentPage = await context.newPage();
      await login(residentPage, DEMO_USERS.residente);
      await residentPage.goto(`/app/obras/${obraIds[0]}/requisiciones`);
      await expect(
        residentPage.getByText("No tienes permiso para consultar este módulo en esta obra.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        residentPage.getByRole("link", { name: "Requisiciones", exact: true }),
      ).toHaveCount(0);
      await residentPage.goto(`/app/obras/${obraIds[1]}/requisiciones`);
      await expect(
        residentPage.getByRole("heading", { name: "Requisiciones", exact: true }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  } finally {
    await admin.from("obras").delete().in("id", obraIds);
    await resident.client.auth.signOut();
  }
});
