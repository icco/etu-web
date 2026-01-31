"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { userSettingsService } from "@/lib/grpc/client"
import { revalidatePath } from "next/cache"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

const updateUsernameSchema = z.object({
  username: z.string().min(1, "Username is required").max(100, "Username is too long"),
})

const updateNotionKeySchema = z.object({
  notionKey: z.string().optional(),
})

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const parsed = updateUsernameSchema.safeParse({
    username: formData.get("username"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        username: parsed.data.username,
      },
      getGrpcApiKey()
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Failed to update profile" }
  }
}

export async function updateNotionKey(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const parsed = updateNotionKeySchema.safeParse({
    notionKey: formData.get("notionKey") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        notionKey: parsed.data.notionKey,
      },
      getGrpcApiKey()
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Update Notion key error:", error)
    return { error: "Failed to update Notion key" }
  }
}

export async function getUserSettings() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const response = await userSettingsService.getUserSettings(
      { userId: session.user.id },
      getGrpcApiKey()
    )
    return response.settings
  } catch (error) {
    console.error("Get user settings error:", error)
    return null
  }
}
