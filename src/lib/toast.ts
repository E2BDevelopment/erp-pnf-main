import { toast as sonnerToast } from "sonner";

const TECHNICAL_ERROR = /(?:\b(?:error|exception):|\b(?:TypeError|SyntaxError|ReferenceError|RangeError|AuthApiError|StorageApiError|FunctionsHttpError|PostgrestError|NetworkError|AbortError)\b|\b(?:PGRST|PostgREST|PostgreSQL|SQLSTATE|ECONN[A-Z]*|ERR_[A-Z_]+)\b|\b[0-9A-F]{5}\b|\b(?:violates? (?:the )?(?:row-level security|foreign key|unique|check) (?:constraint|policy)|duplicate key|schema cache|relation ".+" does not exist|column ".+" does not exist|permission denied for (?:table|schema|relation)|invalid input syntax for type|failed to fetch|fetch failed|network request failed|jwt expired|unexpected end of json input)\b|\bat\s+.+:\d+:\d+)/i;

const AUTH_MESSAGES: [RegExp, string][] = [
  [/^invalid login credentials$/i, "El correo o la contraseña son incorrectos."],
  [/^email not confirmed$/i, "Confirma tu correo antes de iniciar sesión."],
  [/^user already registered$/i, "Ya existe una cuenta con ese correo."],
  [/^password should be at least (\d+) characters?$/i, "La contraseña debe tener al menos $1 caracteres."],
];

export function safeErrorMessage(value: unknown, fallback = "No se pudo completar la operación.") {
  const message = typeof value === "string" ? value : value instanceof Error ? value.message : "";
  const normalized = message.trim();
  if (!normalized) return fallback;
  const authMessage = AUTH_MESSAGES.find(([pattern]) => pattern.test(normalized));
  if (authMessage) return normalized.replace(authMessage[0], authMessage[1]);
  return TECHNICAL_ERROR.test(normalized) ? fallback : normalized;
}

export function safeNotificationText(value: unknown, fallback: string) {
  return safeErrorMessage(value, fallback);
}

export const toast = new Proxy(sonnerToast, {
  get(target, property) {
    if (property === "error") {
      return (
        message: Parameters<typeof target.error>[0],
        options?: Parameters<typeof target.error>[1],
      ) => target.error(safeErrorMessage(message), options);
    }

    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
