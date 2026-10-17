import { createHash, randomUUID } from "node:crypto"
import logger from "@/lib/logger"
import { funnelEvent, type FunnelEvent } from "@/lib/telemetry"

const mockState = globalThis as typeof globalThis & { etuFunnelEvents?: { event: FunnelEvent; key?: string }[] }

/** Funnel events captured instead of sent while E2E_MOCK is enabled. */
export function recordedFunnelEvents(): { event: FunnelEvent; key?: string }[] {
  return (mockState.etuFunnelEvents ??= [])
}

export async function trackFunnelEvent(event: FunnelEvent, eventId?: string): Promise<void> {
  const parsed = funnelEvent.safeParse(event)
  if (!parsed.success) {
    logger.warn({ telemetry: "funnel" }, "Invalid funnel event")
    return
  }
  if (process.env.E2E_MOCK === "true") {
    recordedFunnelEvents().push({ event: parsed.data, key: eventId })
    return
  }

  const id = eventId
    ? createHash("sha256").update(`${event}:${eventId}`).digest("hex")
    : randomUUID()

  try {
    const response = await fetch("https://reportd.natwelch.com/analytics/etu-web", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: event, value: 1, delta: 1, id, label: "custom" }),
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    })
    if (!response.ok) {
      logger.warn({ telemetry: "funnel", event, status: response.status }, "Funnel delivery failed")
    }
  } catch {
    logger.warn({ telemetry: "funnel", event }, "Funnel delivery failed")
  }
}
