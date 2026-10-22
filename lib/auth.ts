import NextAuth, { AuthError, CredentialsSignin } from "next-auth"
import { Code } from "@connectrpc/connect"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { apiKeysService, authService, GrpcError, timestampToDate } from "./grpc/client"
import { clientIpFromHeaders } from "./client-ip"
import logger from "./logger"

declare module "next-auth" {
  interface User {
    sessionKey?: string
    sessionKeyId?: string
  }
}

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited"
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sessionKey = user.sessionKey
        token.sessionKeyId = user.sessionKeyId
        return token
      }
      if (typeof token.sessionKey !== "string" || typeof token.id !== "string") return null
      const verified = await apiKeysService.verifyApiKey({ rawKey: token.sessionKey }, getGrpcApiKey())
      if (!verified.valid || verified.userId !== token.id) return null
      const current = await authService.getUser({ userId: token.id }, getGrpcApiKey())
      return current.user.disabled ? null : token
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message)) return
      const token = message.token
      if (typeof token?.id !== "string" || typeof token.sessionKeyId !== "string") return
      if (typeof token.sessionKey !== "string") return
      const verified = await apiKeysService.verifyApiKey({ rawKey: token.sessionKey }, getGrpcApiKey())
      if (!verified.valid) return
      await apiKeysService.deleteApiKey({ userId: token.id, keyId: token.sessionKeyId }, getGrpcApiKey())
    },
  },
  logger: {
    error(error) {
      // Demote UnknownAction (typically bot probes hitting /api/auth/<bad>)
      // to a structured warn-level pino log so it doesn't show up as raw
      // ANSI-coded stderr in container logs.
      if (
        error instanceof AuthError
          ? error.type === "UnknownAction"
          : error?.name === "UnknownAction"
      ) {
        logger.warn({ err: error }, "auth: unknown action")
        return
      }
      logger.error({ err: error }, "auth error")
    },
    warn(code) {
      logger.warn({ code }, "auth warning")
    },
    debug(message, metadata) {
      logger.debug({ metadata }, message)
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        try {
          const key = await authService.login(
            { email, password, clientIp: clientIpFromHeaders(request.headers) },
            getGrpcApiKey()
          )
          const verified = await apiKeysService.verifyApiKey({ rawKey: key.rawKey }, getGrpcApiKey())
          if (!verified.valid || !verified.userId) return null
          const response = await authService.getUser({ userId: verified.userId }, getGrpcApiKey())
          if (response.user.disabled) return null

          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            image: response.user.image,
            sessionKey: key.rawKey,
            sessionKeyId: key.apiKey.id,
          }
        } catch (error) {
          if (error instanceof GrpcError && error.code === Code.ResourceExhausted) {
            throw new RateLimitedSignin()
          }
          logger.error({ error }, "Authentication error")
          return null
        }
      },
    }),
  ],
})

// Helper to get current user with subscription info
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    const response = await authService.getUser(
      { userId: session.user.id },
      getGrpcApiKey()
    )

    return {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name ?? null,
      image: response.user.image ?? null,
      subscriptionStatus: response.user.subscriptionStatus,
      subscriptionEnd: response.user.subscriptionEnd
        ? timestampToDate(response.user.subscriptionEnd)
        : null,
      createdAt: timestampToDate(response.user.createdAt),
      updatedAt: response.user.updatedAt
        ? timestampToDate(response.user.updatedAt)
        : null,
      hasNotionKey: response.user.hasNotionKey,
      aiEnabled: response.user.aiEnabled,
      hasStripeCustomer: Boolean(response.user.stripeCustomerId),
      cancelAtPeriodEnd: Boolean(response.user.cancelAtPeriodEnd),
      billingProvider: response.user.billingProvider ?? "",
    }
  } catch (error) {
    logger.error({ error }, "Get current user error")
    return null
  }
}
