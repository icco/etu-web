import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { authService, userSettingsService } from "@/lib/grpc/client"
import logger from "@/lib/logger"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { user } = await authService.getUser(
      { userId: session.user.id },
      getGrpcApiKey()
    )
    if (!user.image) {
      return NextResponse.json({ error: "No avatar" }, { status: 404 })
    }

    const { url } = await userSettingsService.getProfileImageURL(
      { key: user.image },
      getGrpcApiKey()
    )

    return NextResponse.redirect(url, {
      status: 302,
      // Browser may reuse the redirect for 5 minutes before re-checking.
      headers: { "Cache-Control": "private, max-age=300" },
    })
  } catch (error) {
    logger.error({ error, userId: session.user.id }, "avatar resolution failed")
    return NextResponse.json({ error: "Failed to resolve avatar" }, { status: 500 })
  }
}
