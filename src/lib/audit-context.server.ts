import { AsyncLocalStorage } from "node:async_hooks";

type AuditContext = { actorUserId: string; companyId: string | null };

const auditContext = new AsyncLocalStorage<AuditContext>();

export function runWithAuditContext<T>(context: AuditContext, callback: () => Promise<T>) {
  return auditContext.run(context, callback);
}

export function getAuditContext() {
  return auditContext.getStore();
}
