import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { notesService } from "@/lib/grpc/client"
import { hasPaidAccess } from "@/lib/paid-access"
import { SubscriptionView } from "./subscription-view"

export const metadata: Metadata = {
  title: "Subscription | Etu",
}

export default async function SubscriptionPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const apiKey = process.env.GRPC_API_KEY
  if (!apiKey) throw new Error("GRPC_API_KEY environment variable is required")
  const playManaged = user.billingProvider === "play" && await hasPaidAccess(user.id, apiKey, notesService)

  return <SubscriptionView user={user} playManaged={playManaged} />
}
