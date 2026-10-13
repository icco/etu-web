import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"

export const LEGAL_ENTITY = "Time Climbers LLC"
export const LEGAL_EMAIL = "nat@natwelch.com"
export const LEGAL_UPDATED = "October 13, 2026"

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-base-200">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base-content/70 hover:text-base-content mb-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Etu
        </Link>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-base-content/60 mb-10">Last updated {LEGAL_UPDATED}</p>
        <div className="space-y-6 text-base-content/80 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-base-content [&_h2]:mt-10 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:link [&_a]:link-primary">
          {children}
        </div>
      </div>
    </div>
  )
}
