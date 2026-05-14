"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"

interface SubscriptionViewProps {
  user: {
    subscriptionStatus: string
    subscriptionEnd: Date | null
    hasStripeCustomer: boolean
  }
}

export function SubscriptionView({ user }: SubscriptionViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const result = searchParams.get("subscription")
    if (!result) return
    if (result === "success") {
      toast.success("Subscription updated")
      router.refresh()
    } else if (result === "canceled") {
      toast.info("Subscription change canceled")
    }
    // Strip the query param so the toast doesn't re-fire on refresh
    router.replace("/settings/subscription")
  }, [searchParams, router])

  const handleManage = async () => {
    setIsLoading(true)
    try {
      const endpoint = user.hasStripeCustomer
        ? "/api/stripe/portal"
        : "/api/stripe/checkout"
      const res = await fetch(endpoint, { method: "POST" })
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
  }

  const buttonLabel = user.hasStripeCustomer ? "Manage Subscription" : "Subscribe"

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
              {user.subscriptionStatus === "active" ? "Renews" : "Ends"}{" "}
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
            Powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
