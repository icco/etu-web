"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { apiKeysService, timestampToDate } from "@/lib/grpc/client"
import { isRateLimited } from "@/lib/rate-limit"
import logger from "@/lib/logger"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
})

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function createApiKey(name: string) {
  const userId = await requireUser()
  createKeySchema.parse({ name })

  // Rate limiting: 10 API key creations per hour per user
  const rateLimitKey = `api-key-create:${userId}`
  if (isRateLimited(rateLimitKey, 10, 60 * 60 * 1000)) {
    logger.security("API key creation rate limit exceeded", { userId })
    throw new Error(
      "Too many API keys created. Please try again later."
    )
  }

  const response = await apiKeysService.createApiKey(
    { userId, name },
    getGrpcApiKey()
  )

  revalidatePath("/settings")

  // Return the raw key only on creation
  return {
    id: response.apiKey.id,
    name: response.apiKey.name,
    key: response.rawKey,
    keyPrefix: response.apiKey.keyPrefix,
    createdAt: timestampToDate(response.apiKey.createdAt),
  }
}

export async function getApiKeys() {
  const userId = await requireUser()

  const response = await apiKeysService.listApiKeys({ userId }, getGrpcApiKey())

  return response.apiKeys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    createdAt: timestampToDate(key.createdAt),
    lastUsed: key.lastUsed ? timestampToDate(key.lastUsed) : null,
  }))
}

export async function deleteApiKey(id: string) {
  const userId = await requireUser()

  await apiKeysService.deleteApiKey({ userId, keyId: id }, getGrpcApiKey())

  revalidatePath("/settings")
  return { success: true }
}

// Verify an API key and return the user ID
export async function verifyApiKey(rawKey: string): Promise<string | null> {
  try {
    const response = await apiKeysService.verifyApiKey({ rawKey }, getGrpcApiKey())
    return response.valid ? (response.userId ?? null) : null
  } catch {
    return null
  }
}
