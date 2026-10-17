"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

interface SubscriptionViewProps {
  user: {
    subscriptionStatus: string
    subscriptionEnd: Date | null
    hasStripeCustomer: boolean
    cancelAtPeriodEnd: boolean
  }
}

export function SubscriptionView({ user }: SubscriptionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const checkoutStartedRef = useRef(false)
  const needsCheckout = !user.hasStripeCustomer || ["free", "canceled", "inactive", "incomplete_expired"].includes(user.subscriptionStatus)

  useEffect(() => {
    const result = searchParams.get("subscription")
    if (!result) return
    if (result === "success") {
      toast.info("Checkout completed. Your subscription is being confirmed.", { id: "subscription-result" })
      router.refresh()
    } else if (result === "canceled") {
      toast.info("Subscription change canceled", { id: "subscription-result" })
    }
    // Strip the query param so the toast doesn't re-fire on refresh
    router.replace("/settings/subscription")
  }, [searchParams, router])

  const handleManage = useCallback(async () => {
    setIsLoading(true)
    try {
      const endpoint = needsCheckout ? "/api/stripe/checkout" : "/api/stripe/portal"
      let res = await fetch(endpoint, { method: "POST" })
      if (res.status === 409 && endpoint === "/api/stripe/checkout") {
        res = await fetch("/api/stripe/portal", { method: "POST" })
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to open subscription")
      }
      const { url } = await res.json()
      if (!url) throw new Error("No redirect URL returned")
      window.location.href = url
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(message)
      setIsLoading(false)
    }
  }, [needsCheckout])

  useEffect(() => {
    if (searchParams.get("checkout") !== "start" || checkoutStartedRef.current) return
    checkoutStartedRef.current = true
    router.replace("/settings/subscription")
    void handleManage()
  }, [searchParams, router, handleManage])

  const buttonLabel = needsCheckout ? "Subscribe" : "Manage Subscription"

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Subscription</h2>
        <div className="flex items-center gap-4">
          <span
            className={`badge ${user.subscriptionStatus === "active"
              ? "badge-success"
              : user.subscriptionStatus === "trial"
                ? "bg-warning text-black"
                : user.subscriptionStatus === "past_due"
                  ? "badge-error"
                  : "badge-ghost"
              }`}
          >
            {user.subscriptionStatus === "past_due"
              ? "Past due"
              : user.subscriptionStatus.charAt(0).toUpperCase() + user.subscriptionStatus.slice(1)}
          </span>
          {user.subscriptionEnd && (
            <span className="text-sm text-base-content/60" suppressHydrationWarning>
              {user.subscriptionStatus === "active" && !user.cancelAtPeriodEnd
                ? "Renews"
                : "Ends"}{" "}
              {format(new Date(user.subscriptionEnd), "MMMM d, yyyy")}
            </span>
          )}
        </div>

        <div className="divider"></div>

        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">$5</span>
            <span className="text-base-content/60">/ year</span>
          </div>
          <button
            className="btn btn-ghost w-full gap-2"
            onClick={handleManage}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <CreditCardIcon className="h-5 w-5" />
            )}
            {buttonLabel}
          </button>
          <p className="text-xs text-base-content/60 text-center mt-2">
            New subscribers get a 14-day trial. A card is required. Powered by Stripe.
          </p>
          <button className="btn btn-ghost w-full mt-2" onClick={() => router.refresh()}>Refresh subscription status</button>
        </div>
      </div>
    </div>
  )
}
