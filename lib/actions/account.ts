"use server"

import { headers } from "next/headers"
import { Code } from "@connectrpc/connect"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { accountService, authService, GrpcError, userSettingsService } from "@/lib/grpc/client"
import { clientIpFromHeaders } from "@/lib/client-ip"
import logger from "@/lib/logger"

export async function deleteAccount(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return { error: "Not authenticated" }
  const password = formData.get("password")
  if (typeof password !== "string" || !password || formData.get("confirmed") !== "on") {
    return { error: "Enter your password and confirm permanent deletion" }
  }
  try {
    const apiKey = process.env.GRPC_API_KEY
    if (!apiKey) throw new Error("GRPC_API_KEY environment variable is required")
    const verified = await authService.authenticate({ email: session.user.email, password, clientIp: clientIpFromHeaders(await headers()) }, apiKey)
    if (!verified.success || verified.user?.id !== session.user.id) return { error: "Current password is incorrect" }
    const result = await accountService.deleteAccount({ userId: session.user.id, password }, apiKey)
    if (!result.success) throw new Error("Account deletion was not completed")
    return { success: true }
  } catch (error) {
    logger.error({ error }, "Account deletion failed")
    if (error instanceof GrpcError && error.code === Code.Unauthenticated) return { error: "Current password is incorrect" }
    if (error instanceof GrpcError && error.code === Code.ResourceExhausted) return { error: "Too many attempts. Please try again later." }
    return { error: "Unable to delete account. If access is disabled, contact nat@natwelch.com to complete deletion." }
  }
}

export async function updateAiPreference(aiEnabled: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }
  if (typeof aiEnabled !== "boolean") return { error: "Invalid AI preference" }
  try {
    const apiKey = process.env.GRPC_API_KEY
    if (!apiKey) throw new Error("GRPC_API_KEY environment variable is required")
    await userSettingsService.updateUserSettings({ userId: session.user.id, aiEnabled }, apiKey)
    revalidatePath("/settings/account")
    return { success: true }
  } catch (error) {
    logger.error({ error }, "AI preference update failed")
    return { error: "Unable to update AI preference" }
  }
}
