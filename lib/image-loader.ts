const GATEWAY_HOST = "images.natwelch.com"

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  if (!src.startsWith("https://")) return src

  const url = new URL(src)
  if (url.hostname !== GATEWAY_HOST) return src

  url.searchParams.set("fit", url.searchParams.get("fit") || "max")
  url.searchParams.set("w", String(width))
  if (quality !== undefined) {
    url.searchParams.set("q", String(quality))
  }
  return url.href
}
