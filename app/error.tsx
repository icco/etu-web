"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Stale Server Action IDs from older deployments cannot be recovered by
  // retrying the same request, but a fresh client render resolves to the
  // current build's IDs. Reset once on mount so users don't see an error
  // state for a transient deploy-window mismatch.
  useEffect(() => {
    if (error?.message?.includes("Failed to find Server Action")) {
      reset()
    }
  }, [error, reset])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-base-content/70">
          An unexpected error occurred. You can try again or reload the page.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="btn btn-primary">
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
