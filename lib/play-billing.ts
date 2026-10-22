export const PLAY_SUBSCRIPTION_URL = "https://play.google.com/store/account/subscriptions?sku=etu&package=com.timeclimbers.etu"

export class PlayManagedError extends Error {}

export async function assertStripeCheckoutAllowed(user: { billingProvider?: string }, hasPaid: () => Promise<boolean>) {
  if (user.billingProvider === "play" && await hasPaid()) {
    throw new PlayManagedError("Your subscription is managed by Google Play")
  }
}
