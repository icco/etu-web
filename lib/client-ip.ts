import { isIP } from "node:net"

// Caddy replaces client-supplied X-Forwarded-For, so the last hop is the connecting address.
export function clientIpFromHeaders(headers: Headers): string | undefined {
  const hops = headers.get("x-forwarded-for")?.split(",")
  const ip = hops?.[hops.length - 1]?.trim() || headers.get("x-real-ip")?.trim()
  return ip && isIP(ip) ? ip : undefined
}
