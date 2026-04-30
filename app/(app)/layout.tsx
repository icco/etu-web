import { redirect } from "next/navigation"
import { SiteHeader } from "@icco/react-common/SiteHeader"
import { auth } from "@/lib/auth"
import { UserImageProvider } from "@/components/user-image-context"
import { UserMenu } from "@/components/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <UserImageProvider image={session.user.image}>
      <SiteHeader showLogo={false}>
        <UserMenu />
      </SiteHeader>
      {children}
    </UserImageProvider>
  )
}
