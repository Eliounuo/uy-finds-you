import { captureException, captureMessage } from "@/lib/monitoring/sentry";

const isDev = import.meta.env.DEV;

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function format(level: LogLevel, message: string, ctx?: LogContext): string {
  return `[${level.toUpperCase()}] ${message}${ctx ? " " + JSON.stringify(ctx) : ""}`;
}

export const logger = {
  debug(message: string, ctx?: LogContext): void {
    if (isDev) console.debug(format("debug", message, ctx));
  },

  info(message: string, ctx?: LogContext): void {
    if (isDev) console.info(format("info", message, ctx));
    else captureMessage(message, "info");
  },

  warn(message: string, ctx?: LogContext): void {
    console.warn(format("warn", message, ctx));
    captureMessage(message, "warning");
  },

  error(message: string, error?: unknown, ctx?: LogContext): void {
    console.error(format("error", message, ctx), error ?? "");
    if (error) captureException(error, { message, ...ctx });
    else captureMessage(message, "error");
  },
};
