"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { sendTelemetry } from "@/lib/telemetry-client"
import type { TelemetryPayload } from "@/lib/telemetry"

const views: Record<string, Extract<TelemetryPayload, { type: "funnel" }>["event"]> = {
  "/": "landing_view",
  "/pricing": "pricing_view",
  "/register": "register_view",
}

export function FunnelAnalytics() {
  const pathname = usePathname()
  const previousRef = useRef<string | null>(null)
  useEffect(() => {
    if (previousRef.current === pathname) return
    previousRef.current = pathname
    const event = views[pathname]
    if (event) sendTelemetry({ type: "funnel", event })
  }, [pathname])
  return null
}
