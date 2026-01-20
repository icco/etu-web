import { NextRequest } from "next/server"
import { verifyApiKey } from "@/lib/actions/api-keys"

/**
 * Authenticate a request using an API key from the Authorization header
 * @param req - The Next.js request object
 * @returns The user ID if authentication is successful, null otherwise
 */
export async function authenticateRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization")
  
  if (!authHeader || !authHeader.startsWith("etu_")) {
    return null
  }

  const apiKey = authHeader.trim()
  return await verifyApiKey(apiKey)
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
