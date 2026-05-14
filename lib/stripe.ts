import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID
export const STRIPE_PORTAL_CONFIGURATION_ID =
  process.env.STRIPE_PORTAL_CONFIGURATION_ID
