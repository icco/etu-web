import { NextResponse } from "next/server"
import { recordedFunnelEvents } from "@/lib/analytics"
import { isMockMode } from "@/lib/grpc/mock"

export async function GET() {
  if (!isMockMode()) {
    return NextResponse.json({ error: "Test telemetry endpoint only available in E2E mock mode" }, { status: 403 })
  }
  return NextResponse.json({ events: recordedFunnelEvents() })
}
