import { expect, test } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";
import { loadTestEnv } from "../helpers/env";
import { adminClient } from "../helpers/supabase";

loadTestEnv();
const admin = adminClient();

test("el director crea un rol, ajusta sus permisos y lo encuentra en Equipo", async ({
  page,
}, testInfo) => {
  const name = `Compras QA ${Date.now()}`;
  const email = `roles-qa-${Date.now()}@example.invalid`;
  try {
    await login(page, DEMO_USERS.director);
    await page.goto("/app/configuracion");
    await page.getByRole("tab", { name: "Permisos", exact: true }).click();
    await page.getByRole("button", { name: "Añadir rol", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre del rol").fill(name);
    await dialog.getByLabel("Perfil base").click();
    await page.getByRole("option", { name: "Administrativo", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath("crear-rol-desktop.png") });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: testInfo.outputPath("crear-rol-mobile.png") });
    await dialog.getByRole("button", { name: "Crear rol", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name, exact: true })).toBeVisible();
    const permission = page.getByRole("checkbox", { name: `${name} — Crear obra`, exact: true });
    await expect(permission).toBeChecked();
    await permission.uncheck();
    await expect(permission).not.toBeChecked();
    await expect(permission).toBeEnabled();
    await page.reload();
    await page.getByRole("tab", { name: "Permisos", exact: true }).click();
    await expect(
      page.getByRole("checkbox", { name: `${name} — Crear obra`, exact: true }),
    ).not.toBeChecked();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: testInfo.outputPath("permisos-desktop.png") });
    await page.goto("/app/equipo");
    await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option", { name, exact: true }).click();
    const invite = page.getByRole("dialog");
    await invite.getByRole("textbox").nth(0).fill(name);
    await invite.getByRole("textbox").nth(1).fill(email);
    await invite.getByRole("textbox").nth(2).fill("Demo1234!");
    await invite.getByRole("button", { name: "Crear usuario", exact: true }).click();
    await expect(invite).toHaveCount(0);
    const row = page.getByRole("row").filter({ hasText: email });
    await expect(row.getByText(name, { exact: true })).toHaveCount(2);
    await row.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option", { name: "Residente", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(row.getByText("Residente", { exact: true })).toBeVisible();
    await row.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option", { name, exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(row.getByText(name, { exact: true })).toHaveCount(2);
    const { data: member } = await admin.from("profiles").select("id").eq("email", email).single();
    const { data: assignment } = await admin
      .from("user_roles")
      .select("role, custom_role_id")
      .eq("user_id", member!.id)
      .single();
    expect(assignment?.role).toBe("administrativo");
    expect(assignment?.custom_role_id).toBeTruthy();
  } finally {
    const { data: members } = await admin.from("profiles").select("id").eq("email", email);
    for (const member of members ?? []) await admin.auth.admin.deleteUser(member.id);
    const { data: roles } = await admin
      .from("company_roles")
      .select("id, company_id")
      .eq("name", name);
    for (const role of roles ?? []) {
      await admin
        .from("role_permissions")
        .delete()
        .eq("company_id", role.company_id)
        .eq("role", role.id);
      await admin.from("company_roles").delete().eq("id", role.id);
    }
  }
});
