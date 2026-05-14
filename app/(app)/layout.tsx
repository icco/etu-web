import Link from "next/link"
import { redirect } from "next/navigation"
import { SiteHeader } from "@icco/react-common/SiteHeader"
import { getCurrentUser } from "@/lib/auth"
import { UserImageProvider } from "@/components/user-image-context"
import { UserMenu } from "@/components/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <UserImageProvider image={user.image} updatedAt={user.updatedAt}>
      <SiteHeader
        brand={
          <Link href="/" className="btn btn-ghost text-xl">
            Etu
          </Link>
        }
      >
        <UserMenu />
      </SiteHeader>
      {children}
    </UserImageProvider>
  )
}
