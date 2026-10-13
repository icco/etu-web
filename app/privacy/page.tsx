import type { Metadata } from "next"
import { LegalPage, LEGAL_EMAIL, LEGAL_ENTITY } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy - Etu",
  description: "How Etu collects, uses, and protects your data",
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Etu is operated by {LEGAL_ENTITY} (&quot;we&quot;, &quot;us&quot;). This policy explains what data we collect when you use
        the Etu website, mobile app, CLI, and API, and what we do with it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account data: your name, email address, password hash, and profile image.</li>
        <li>Content: the notes, tags, images, and audio recordings you create.</li>
        <li>Billing data: subscription status and a Stripe customer ID. Card details are handled by Stripe and never reach our servers.</li>
        <li>Technical data: server logs and anonymous performance metrics used to keep the service running.</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your data only to provide Etu: storing and syncing your notes, searching them, resurfacing them, and
        billing your subscription. We do not sell your data or use it for advertising.
      </p>

      <h2>AI processing</h2>
      <p>
        Etu uses Google Cloud Vertex AI (Gemini models) to suggest tags for notes, extract text from images you
        attach, and transcribe audio you record. When these features run, the relevant note text, image, or audio is
        sent to Google Cloud for processing. Under Google Cloud&apos;s terms, this data is not used to train Google&apos;s
        models. See{" "}
        <a href="https://cloud.google.com/vertex-ai/generative-ai/docs/data-governance">Vertex AI data governance</a>.
      </p>

      <h2>Service providers</h2>
      <ul>
        <li>Google Cloud: hosting, database, file storage, and Vertex AI processing.</li>
        <li>Stripe: payment processing.</li>
      </ul>

      <h2>Retention and deletion</h2>
      <p>
        We keep your data while your account exists. You can delete notes at any time. To delete your account and all
        associated data, email <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. Billing records may be kept as
        required by law.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, export of, or deletion of your personal data by emailing{" "}
        <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.
      </p>

      <h2>Changes</h2>
      <p>We will post changes to this page and update the date above.</p>
    </LegalPage>
  )
}
