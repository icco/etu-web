import Link from "next/link"
import { SiteHeader } from "@icco/react-common/SiteHeader"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader
        brand={
          <Link href="/" className="btn btn-ghost text-xl">
            Etu
          </Link>
        }
      />
      {children}
    </>
  )
}
