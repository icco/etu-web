import { requireSubscribedUser } from "@/lib/access"

export default async function SubscribedLayout({ children }: { children: React.ReactNode }) {
  await requireSubscribedUser()
  return children
}
