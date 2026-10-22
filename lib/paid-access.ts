import { Code } from "@connectrpc/connect"
import type { NotesServiceApi } from "./grpc/client"

export function isSubscriptionRequired(error: unknown) {
  const { code, details } = error as { code?: unknown; details?: unknown }
  return code === Code.PermissionDenied && typeof details === "string" && details.includes("subscription required")
}

// The backend decides access, including past-due grace, so probe it instead of re-deriving it from the status.
export async function hasPaidAccess(userId: string, apiKey: string, notes: Pick<NotesServiceApi, "listNotes">) {
  try {
    await notes.listNotes({ userId, limit: 1 }, apiKey)
    return true
  } catch (error) {
    if (isSubscriptionRequired(error)) return false
    throw error
  }
}
