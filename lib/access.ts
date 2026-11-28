import { cache } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getGrpcApiKey, notesService } from "@/lib/grpc/client"
import { isSubscriptionRequired } from "@/lib/paid-access"

export const requireSubscribedUser = cache(async () => {
  const session = await getSession()
  if (!session?.user?.id) redirect("/login")
  const apiKey = getGrpcApiKey()
  try {
    await notesService.listNotes({ userId: session.user.id, limit: 1 }, apiKey)
  } catch (error) {
    if (isSubscriptionRequired(error)) redirect("/settings/subscription")
    throw error
  }
  return session.user.id
})
