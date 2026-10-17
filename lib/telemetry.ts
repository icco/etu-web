import { z } from "zod"

export const publicFunnelEvent = z.enum(["landing_view", "pricing_view", "register_view"])
export const funnelEvent = z.enum([...publicFunnelEvent.options, "registration_success", "checkout_success"])
export type FunnelEvent = z.infer<typeof funnelEvent>

export const routeLabel = z.enum([
  "/", "/pricing", "/register", "/login", "/docs", "/privacy", "/terms", "/refunds", "/delete-account",
  "/notes", "/history", "/search", "/tags", "/settings", "/settings/account", "/settings/api",
  "/settings/stats", "/settings/subscription", "/api/auth", "/api/stripe", "/api/telemetry", "other",
])

export function sanitizeRoute(path: string): z.infer<typeof routeLabel> {
  const pathname = path.split(/[?#]/, 1)[0]
  if (pathname.startsWith("/api/auth/")) return "/api/auth"
  if (pathname.startsWith("/api/stripe/")) return "/api/stripe"
  const parsed = routeLabel.safeParse(pathname)
  return parsed.success ? parsed.data : "other"
}

export const browserErrorKind = z.enum(["uncaught", "unhandled_rejection", "render"])
export const telemetryPayload = z.discriminatedUnion("type", [
  z.object({ type: z.literal("funnel"), event: publicFunnelEvent }).strict(),
  z.object({ type: z.literal("error"), kind: browserErrorKind, route: routeLabel }).strict(),
])
export type TelemetryPayload = z.infer<typeof telemetryPayload>
