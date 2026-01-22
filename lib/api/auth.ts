import { NextRequest } from "next/server"
import { verifyApiKey } from "@/lib/actions/api-keys"
import { auth } from "@/lib/auth"

/**
 * Authenticate a request using either API key or session
 * Supports both external API clients (API key) and web UI (session)
 * @param req - The Next.js request object
 * @returns The user ID if authentication is successful, null otherwise
 */
export async function authenticateRequest(req: NextRequest): Promise<string | null> {
  // Try API key authentication first
  const authHeader = req.headers.get("Authorization")
  
  if (authHeader && authHeader.startsWith("etu_")) {
    const apiKey = authHeader.trim()
    return await verifyApiKey(apiKey)
  }

  // Fall back to session-based authentication for web UI
  try {
    const session = await auth()
    if (session?.user?.id) {
      return session.user.id
    }
  } catch (error) {
    console.error("Session auth error:", error)
  }

  return null
}

/**
 * Constants for API configuration
 */
export const API_CONSTANTS = {
  /** Maximum number of notes that can be returned in a single request */
  MAX_NOTES_LIMIT: 100,
  /** Default number of notes to return when limit is not specified */
  DEFAULT_NOTES_LIMIT: 50,
} as const
