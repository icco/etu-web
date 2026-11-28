"use server"

import { z } from "zod"
import { auth } from "@/lib/auth"
import { Code } from "@connectrpc/connect"
import { getGrpcApiKey, GrpcError, userSettingsService, type ImageUpload } from "@/lib/grpc/client"
import { revalidatePath } from "next/cache"
import logger from "@/lib/logger"
import { ALLOWED_IMAGE_MIME_TYPES, estimateBase64Size, MAX_IMAGE_BYTES } from "@/lib/uploads"

const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
})

const updateNotionKeySchema = z.object({
  notionKey: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function updateName(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const parsed = updateNameSchema.safeParse({
    name: formData.get("name"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        name: parsed.data.name,
      },
      getGrpcApiKey()
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    logger.error({ error, userId: session.user.id }, "Update name error")
    return { error: "Failed to update name" }
  }
}

export async function updateNotionKey(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const notionKeyValue = formData.get("notionKey")
  const parsed = updateNotionKeySchema.safeParse({
    notionKey: notionKeyValue === null ? undefined : notionKeyValue,
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
    logger.error({ error, userId: session.user.id }, "Update Notion key error")
    return { error: "Failed to update Notion key" }
  }
}

export async function uploadProfileImage(data: { data: string; mimeType: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(data.mimeType)) {
    return { error: "Unsupported image type. Allowed: JPEG, PNG, WebP, GIF" }
  }

  const estimatedBytes = estimateBase64Size(data.data)
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return { error: "Image exceeds maximum size of 5MB" }
  }

  try {
    const buffer = Buffer.from(data.data, "base64")
    const profileImageUpload: ImageUpload = {
      data: new Uint8Array(buffer),
      mimeType: data.mimeType,
    }

    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        profileImageUpload,
      },
      getGrpcApiKey()
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    logger.error({ error, userId: session.user.id }, "Upload profile image error")
    return { error: "Failed to upload profile image" }
  }
}

export async function clearProfileImage() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  try {
    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        clearProfileImage: true,
      },
      getGrpcApiKey()
    )

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    logger.error({ error, userId: session.user.id }, "Clear profile image error")
    return { error: "Failed to remove profile image" }
  }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Not authenticated" }
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await userSettingsService.updateUserSettings(
      {
        userId: session.user.id,
        password: parsed.data.password,
        currentPassword: parsed.data.currentPassword,
      },
      getGrpcApiKey()
    )

    return { success: true }
  } catch (error) {
    if (error instanceof GrpcError && error.code === Code.PermissionDenied && error.details.includes("current password is incorrect")) {
      return { error: "Current password is incorrect" }
    }
    logger.error({ error, userId: session.user.id }, "Change password error")
    return { error: "Failed to change password" }
  }
}
