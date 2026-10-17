import { trackFunnelEvent } from "@/lib/analytics"
import logger from "@/lib/logger"
import { telemetryPayload } from "@/lib/telemetry"

export async function POST(request: Request) {
  const origin = new URL(process.env.AUTH_URL || request.url).origin
  if (request.headers.get("origin") !== origin) return new Response(null, { status: 403 })
  if (!request.body) return new Response(null, { status: 400 })

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 1024) {
        await reader.cancel()
        return new Response(null, { status: 413 })
      }
      chunks.push(value)
    }
    const payload = telemetryPayload.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")))
    if (!payload.success) return new Response(null, { status: 400 })
    if (payload.data.type === "funnel") {
      await trackFunnelEvent(payload.data.event)
    } else {
      logger.error({ telemetry: "browser_error", kind: payload.data.kind, route: payload.data.route }, "Browser error")
    }
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 400 })
  } finally {
    reader.releaseLock()
  }
}
