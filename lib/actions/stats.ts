"use server"

import { auth } from "@/lib/auth"
import { statsService } from "@/lib/grpc/client"

// Helper to get service API key
function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

// Helper to require authenticated user
async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export interface StatsData {
  totalBlips: number
  uniqueTags: number
  wordsWritten: number
}

/**
 * Get statistics for the current user
 */
export async function getUserStats(): Promise<StatsData> {
  const userId = await requireUser()

  const response = await statsService.getStats(
    {
      userId,
    },
    getGrpcApiKey()
  )

  return {
    totalBlips: response.totalBlips,
    uniqueTags: response.uniqueTags,
    wordsWritten: response.wordsWritten,
  }
}

/**
 * Get global statistics for all users
 */
export async function getGlobalStats(): Promise<StatsData> {
  // Ensure user is authenticated before fetching global stats
  await requireUser()

  // Per backend API design: empty userId returns global stats for all users
  const response = await statsService.getStats(
    {
      userId: undefined, // Empty userId for global stats
    },
    getGrpcApiKey()
  )

  return {
    totalBlips: response.totalBlips,
    uniqueTags: response.uniqueTags,
    wordsWritten: response.wordsWritten,
  }
}
