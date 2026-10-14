import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/pricing", "/docs", "/privacy", "/terms", "/refunds", "/delete-account"].map((path) => ({
    url: new URL(path, siteUrl).href,
  }))
}
