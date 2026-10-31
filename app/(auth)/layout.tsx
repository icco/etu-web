import { SiteHeader } from "@icco/react-common/SiteHeader"
import { SiteBrand } from "@/components/site-brand"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader
        brand={<SiteBrand />}
      />
      {children}
    </>
  )
}
