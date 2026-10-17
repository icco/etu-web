import { authService } from "@/lib/grpc/client"
import { stripe } from "@/lib/stripe"
import { handleStripeWebhook } from "@/lib/stripe-webhook"

export async function POST(request: Request) {
  const apiKey = process.env.GRPC_API_KEY
  if (!stripe || !apiKey) return Response.json({ error: "Stripe not configured" }, { status: 503 })
  return handleStripeWebhook(request, {
    stripe,
    auth: authService,
    apiKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  })
}
