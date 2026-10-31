import { redirect } from "next/navigation"
import { SiteHeader } from "@icco/react-common/SiteHeader"
import { getCurrentUser } from "@/lib/auth"
import { UserImageProvider } from "@/components/user-image-context"
import { UserMenu } from "@/components/user-menu"
import { SiteBrand } from "@/components/site-brand"

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
    <UserImageProvider image={user.image}>
      <SiteHeader
        brand={<SiteBrand />}
      >
        <UserMenu />
      </SiteHeader>
      {children}
    </UserImageProvider>
  )
}
