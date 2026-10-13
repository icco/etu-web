import type { Metadata } from "next"
import { LegalPage, LEGAL_EMAIL } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Refund Policy - Etu",
  description: "Etu's refund and cancellation policy",
}

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <p>
        Every Etu account starts with a 14-day free trial so you can decide whether Etu is right for you before you
        pay anything.
      </p>

      <h2>No refunds after the trial</h2>
      <p>
        Payments are non-refundable once the trial ends, and partial years are not prorated. This does not affect any
        rights you have under applicable consumer law.
      </p>

      <h2>Cancelling</h2>
      <p>
        You can cancel any time from Settings &gt; Subscription. Your subscription will not renew, and you keep access
        until the end of the period you paid for.
      </p>

      <h2>Billing errors</h2>
      <p>
        If you were charged in error, email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a> and we will make it
        right.
      </p>
    </LegalPage>
  )
}
