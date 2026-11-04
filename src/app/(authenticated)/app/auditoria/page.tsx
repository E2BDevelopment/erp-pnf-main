"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRealIsDirector, useAuthStore } from "@/stores/auth";
import { getAuditLog } from "@/lib/api-client/auditoria.functions";
import { useServerFn } from "@/lib/server-fn/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardClock,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type Operation = "INSERT" | "UPDATE" | "DELETE" | "all";
type AuditResult = Awaited<ReturnType<typeof getAuditLog>>;

const ACTION_LABELS: Record<Exclude<Operation, "all">, string> = {
  INSERT: "Creación",
  UPDATE: "Edición",
  DELETE: "Eliminación",
};

function recordLabel(record: AuditResult["items"][number]["record_id"]) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "—";
  const id = record.id ?? record.primary_key;
  if (typeof id === "string" || typeof id === "number") return String(id);
  if (id && typeof id === "object" && !Array.isArray(id)) {
    return Object.entries(id)
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  }
  return "—";
}

function changedFields(item: AuditResult["items"][number]) {
  const before: Record<string, unknown> =
    item.old_data && typeof item.old_data === "object" && !Array.isArray(item.old_data)
      ? item.old_data
      : {};
  const after: Record<string, unknown> =
    item.new_data && typeof item.new_data === "object" && !Array.isArray(item.new_data)
      ? item.new_data
      : {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [...keys].filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return changed.length ? changed.join(", ") : "Sin campos modificados";
}

export default function AuditoriaPage() {
  const isDirector = useRealIsDirector();
  const authLoading = useAuthStore((state) => state.loading);
  const fetchAuditLog = useServerFn(getAuditLog);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [page, setPage] = useState(0);
  const [operation, setOperation] = useState<Operation>("all");
  const [table, setTable] = useState("");

  const actorNames = useMemo(
    () =>
      new Map(
        result?.actors.map((actor) => [actor.id, actor.nombre_completo || actor.email]) ?? [],
      ),
    [result?.actors],
  );
  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / (result?.pageSize ?? 50)));

  async function loadPage(nextPage: number, event?: FormEvent) {
    event?.preventDefault();
    if (!password) {
      setError("Escribe tu contraseña para consultar la bitácora.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchAuditLog({ data: { password, page: nextPage, operation, table } });
      setResult(data);
      setPage(nextPage);
      setUnlocked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la bitácora.");
      setUnlocked(false);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function lock() {
    setUnlocked(false);
    setPassword("");
    setResult(null);
    setError("");
    setPage(0);
  }

  if (authLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        Cargando perfil…
      </div>
    );
  if (!isDirector) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <ShieldCheck className="mb-4 h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-xl font-semibold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La bitácora de auditoría está disponible únicamente para el perfil Director.
          </p>
        </div>
      </section>
    );
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-800">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora de auditoría</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Confirma tu contraseña para consultar los cambios registrados en la empresa. La
            contraseña se valida antes de cada consulta.
          </p>
          <form className="mt-6 max-w-md space-y-3" onSubmit={(event) => loadPage(0, event)}>
            <label htmlFor="audit-password" className="text-sm font-medium">
              Contraseña de tu cuenta
            </label>
            <Input
              id="audit-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
              disabled={loading}
              placeholder="Ingresa tu contraseña"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading || !password} className="w-full sm:w-auto">
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              {loading ? "Validando…" : "Validar y consultar"}
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Bitácora de auditoría
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Historial de cambios registrados en las tablas de la empresa.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={lock}>
          <LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" />
          Bloquear bitácora
        </Button>
      </header>

      <form
        className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-end"
        onSubmit={(event) => loadPage(0, event)}
      >
        <div className="w-full sm:max-w-xs">
          <label
            htmlFor="audit-table"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Tabla
          </label>
          <Input
            id="audit-table"
            value={table}
            onChange={(event) => setTable(event.target.value)}
            placeholder="Buscar por tabla"
          />
        </div>
        <div className="w-full sm:w-52">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Acción</label>
          <Select value={operation} onValueChange={(value) => setOperation(value as Operation)}>
            <SelectTrigger aria-label="Filtrar por acción">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="INSERT">Creaciones</SelectItem>
              <SelectItem value="UPDATE">Ediciones</SelectItem>
              <SelectItem value="DELETE">Eliminaciones</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="outline" disabled={loading}>
          <FileSearch className="mr-2 h-4 w-4" aria-hidden="true" />
          {loading ? "Buscando…" : "Aplicar filtros"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{result?.total ?? 0} registros</span>
        <span>
          Página {page + 1} de {pageCount}
        </span>
      </div>

      {result?.items.length ? (
        <div className="mt-2 overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha y hora</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Tabla</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {new Date(item.occurred_at).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {item.actor_user_id
                      ? (actorNames.get(item.actor_user_id) ?? item.actor_user_id)
                      : "Proceso del sistema"}
                  </td>
                  <td className="px-4 py-3">
                    {ACTION_LABELS[item.operation as keyof typeof ACTION_LABELS] ?? item.operation}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.table_name}</td>
                  <td
                    className="max-w-48 truncate px-4 py-3 font-mono text-xs"
                    title={recordLabel(item.record_id)}
                  >
                    {recordLabel(item.record_id)}
                  </td>
                  <td className="px-4 py-3">
                    <details className="max-w-sm">
                      <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
                        Ver cambios
                      </summary>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Campos: {changedFields(item)}
                      </p>
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {item.old_data && (
                          <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                            {JSON.stringify(item.old_data, null, 2)}
                          </pre>
                        )}
                        {item.new_data && (
                          <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                            {JSON.stringify(item.new_data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-2 rounded-lg border bg-card px-6 py-14 text-center">
          <ClipboardClock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-medium">No hay registros para mostrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los cambios nuevos aparecerán aquí cuando se registren.
          </p>
        </div>
      )}

      <footer className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={loading || page === 0}
          onClick={() => loadPage(page - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || page + 1 >= pageCount}
          onClick={() => loadPage(page + 1)}
        >
          Siguiente
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </footer>
    </section>
  );
}
