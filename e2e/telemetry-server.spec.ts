import { test, expect } from "@playwright/test"
import { trackFunnelEvent } from "../lib/analytics"
import { sanitizeRoute } from "../lib/telemetry"
import { onRequestError } from "../instrumentation"
import logger from "../lib/logger"

test("server funnel counts use reportd's contract and retry-stable opaque IDs", async () => {
  const originalFetch = globalThis.fetch
  const mock = process.env.E2E_MOCK
  const sent: { url: string; body: Record<string, unknown> }[] = []
  delete process.env.E2E_MOCK
  globalThis.fetch = async (url, init) => {
    sent.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return new Response(null, { status: 204 })
  }
  try {
    await trackFunnelEvent("checkout_success", "evt_fictional_checkout")
    await trackFunnelEvent("checkout_success", "evt_fictional_checkout")
    await trackFunnelEvent("registration_success")
    expect(sent).toHaveLength(3)
    expect(sent[0].url).toBe("https://reportd.natwelch.com/analytics/etu-web")
    expect(sent[0].body).toEqual({ name: "checkout_success", value: 1, delta: 1, label: "custom", id: expect.stringMatching(/^[a-f0-9]{64}$/) })
    expect(sent[1].body.id).toBe(sent[0].body.id)
    expect(sent[2].body.id).not.toBe(sent[0].body.id)
    expect(JSON.stringify(sent)).not.toContain("evt_fictional_checkout")
    globalThis.fetch = async () => { throw new Error("private upstream response") }
    await expect(trackFunnelEvent("registration_success")).resolves.toBeUndefined()
  } finally {
    globalThis.fetch = originalFetch
    if (mock === undefined) delete process.env.E2E_MOCK
    else process.env.E2E_MOCK = mock
  }
})

test("server error logs contain bounded labels instead of request or error contents", async () => {
  const errorLogger = logger.error
  const runtime = process.env.NEXT_RUNTIME
  const records: unknown[] = []
  process.env.NEXT_RUNTIME = "nodejs"
  logger.error = ((fields: unknown) => { records.push(fields) }) as typeof logger.error
  try {
    await onRequestError(new Error("alice@example.com private note"), {
      path: "/search?q=private-note",
      method: "POST",
      headers: { authorization: "secret" },
    }, { routerKind: "App Router", routePath: "/search", routeType: "render", revalidateReason: undefined })
    expect(records).toEqual([{ telemetry: "server_error", kind: "Error", route: "/search", operation: "render" }])
    expect(sanitizeRoute("/notes/private-id?token=secret")).toBe("other")
    expect(sanitizeRoute("/api/auth/callback/credentials?token=secret")).toBe("/api/auth")
  } finally {
    logger.error = errorLogger
    if (runtime === undefined) delete process.env.NEXT_RUNTIME
    else process.env.NEXT_RUNTIME = runtime
  }
})
