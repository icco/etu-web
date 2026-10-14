import { cache } from "react"
import { redirect } from "next/navigation"
import { Code } from "@connectrpc/connect"
import { auth } from "@/lib/auth"
import { GrpcError, notesService } from "@/lib/grpc/client"

export const requireSubscribedUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const apiKey = process.env.GRPC_API_KEY
  if (!apiKey) throw new Error("GRPC_API_KEY environment variable is required")
  try {
    await notesService.listNotes({ userId: session.user.id, limit: 1 }, apiKey)
  } catch (error) {
    if (error instanceof GrpcError && error.code === Code.PermissionDenied && error.details.includes("subscription required")) {
      redirect("/settings/subscription")
    }
    throw error
  }
  return session.user.id
})
