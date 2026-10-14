"use server"

import { z } from "zod"
import { signIn } from "@/lib/auth"
import { AuthError, CredentialsSignin } from "next-auth"
import { headers } from "next/headers"
import { authService, GrpcError } from "@/lib/grpc/client"
import { Code } from "@connectrpc/connect"
import logger from "@/lib/logger"
import { clientIpFromHeaders } from "@/lib/client-ip"

function getGrpcApiKey(): string {
  const key = process.env.GRPC_API_KEY
  if (!key) {
    throw new Error("GRPC_API_KEY environment variable is required")
  }
  return key
}

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
})

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password } = parsed.data

  try {
    const clientIp = clientIpFromHeaders(await headers())
    await authService.register({ email, password, clientIp }, getGrpcApiKey())
  } catch (error) {
    // Check if it's a "user already exists" error using gRPC status code
    if (error instanceof GrpcError && error.code === Code.AlreadyExists) {
      return { error: "An account with this email already exists" }
    }
    if (error instanceof GrpcError && error.code === Code.ResourceExhausted) {
      return { error: "Too many attempts. Try again in a few minutes." }
    }
    logger.error({ error, email }, "Registration error")
    return { error: "Failed to create account" }
  }

  // Sign in the new user
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/settings/subscription?checkout=start",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to sign in after registration" }
    }
    throw error
  }
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password } = parsed.data

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/notes",
    })
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "rate_limited") {
      return { error: "Too many attempts. Try again in a few minutes." }
    }
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" }
        default:
          return { error: "Something went wrong" }
      }
    }
    throw error
  }
}
