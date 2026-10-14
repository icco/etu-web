import logger from "@/lib/logger"

export function logServerError(fields: { telemetry: string; kind: string; route: string; operation: string }) {
  logger.error(fields, "Server request error")
}
