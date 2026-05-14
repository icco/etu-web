const IMGIX_DOMAIN = "etu.imgix.net"

function buildImgixURL(src: string): URL | null {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return null
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    const parsed = new URL(src)
    if (parsed.hostname !== IMGIX_DOMAIN) {
      return null
    }
    return parsed
  }

  const path = src.startsWith("/") ? src : `/${src}`
  return new URL(`https://${IMGIX_DOMAIN}${path}`)
}

export default function imgixLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  const url = buildImgixURL(src)
  if (!url) return src

  const params = url.searchParams
  params.set("auto", params.getAll("auto").join(",") || "format,compress")
  params.set("fit", params.get("fit") || "max")
  params.set("w", params.get("w") || String(width))
  if (quality !== undefined) {
    params.set("q", String(quality))
  }
  return url.href
}
