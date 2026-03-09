import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { UserImageProvider } from "@/components/user-image-context"

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
      {children}
    </UserImageProvider>
  )
}
