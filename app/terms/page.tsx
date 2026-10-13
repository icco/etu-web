import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LEGAL_EMAIL, LEGAL_ENTITY } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service - Etu",
  description: "Terms for using Etu",
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of Etu, operated by {LEGAL_ENTITY}. By creating an account or using Etu you agree
        to them.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for keeping your credentials and API keys secure and for activity on your account. You
        must be at least 13 years old to use Etu.
      </p>

      <h2>Your content</h2>
      <p>
        You own the notes, images, and audio you put in Etu. You grant us a limited license to store, process, and
        display that content solely to provide the service, including the AI processing described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use Etu to break the law, store content you have no right to, abuse or overload the API, or attempt to
        access other users&apos; data.
      </p>

      <h2>Subscription and billing</h2>
      <p>
        Etu includes a 14-day free trial, then costs $5 per year, billed through Stripe. Subscriptions renew
        automatically each year until canceled. You can cancel any time from Settings, and access continues until the
        end of the paid period. See our <Link href="/refunds">Refund Policy</Link>.
      </p>

      <h2>Termination</h2>
      <p>
        You can stop using Etu at any time. We may suspend accounts that violate these terms.
      </p>

      <h2>Disclaimer and liability</h2>
      <p>
        Etu is provided &quot;as is&quot; without warranties of any kind. AI-generated tags, transcriptions, and text extraction
        may be inaccurate. To the maximum extent permitted by law, our total liability for any claim is limited to the
        amount you paid us in the 12 months before the claim.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of Delaware, USA.</p>

      <h2>Changes and contact</h2>
      <p>
        We will post changes to this page and update the date above. Questions:{" "}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>
    </LegalPage>
  )
}
