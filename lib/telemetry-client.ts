"use client"

import { sanitizeRoute, type TelemetryPayload } from "@/lib/telemetry"

const reportedErrors = new Set<string>()

export function sendTelemetry(payload: TelemetryPayload) {
  void fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
  }).then((response) => {
    if (!response.ok) console.warn("Telemetry delivery failed")
  }).catch(() => {
    console.warn("Telemetry delivery failed")
  })
}

export function reportBrowserError(kind: "uncaught" | "unhandled_rejection" | "render") {
  const route = sanitizeRoute(window.location.pathname)
  const key = `${kind}:${route}`
  if (reportedErrors.has(key) || reportedErrors.size >= 10) return
  reportedErrors.add(key)
  sendTelemetry({ type: "error", kind, route })
}
