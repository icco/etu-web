import { SiteHeader } from "@icco/react-common/SiteHeader"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader showLogo={false} />
      {children}
    </>
  )
}
