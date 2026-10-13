import type { Metadata } from "next"
import Link from "next/link"
import { CheckIcon } from "@heroicons/react/24/outline"
import { LegalPage } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Pricing - Etu",
  description: "Etu costs $5 per year after a 14-day free trial",
}

const features = [
  "Unlimited notes, tags, images, and audio",
  "AI tag suggestions, image text extraction, and audio transcription",
  "Web, mobile, CLI, and API access",
  "Cancel any time",
]

export default function PricingPage() {
  return (
    <LegalPage title="Pricing">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title !mt-0">Etu</h2>
          <p className="text-4xl font-bold text-base-content">
            $5<span className="text-lg font-normal text-base-content/60"> / year</span>
          </p>
          <p>14-day free trial. No card required to start.</p>
          <ul className="!list-none !pl-0 my-4">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn btn-primary !no-underline">
            Start free trial
          </Link>
        </div>
      </div>
      <p>
        Prices are in USD and renew yearly. See the <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/refunds">Refund Policy</Link>.
      </p>
    </LegalPage>
  )
}
