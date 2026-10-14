import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Delete your account | Etu" }

export default function DeleteAccountPage() {
  return <main className="flex-1 mx-auto max-w-2xl px-4 py-12 space-y-4">
    <h1 className="text-3xl">Delete your Etu account</h1>
    <p>Sign in, open Account Settings, and use Delete account with your current password. Your subscription is canceled and your account, notes, tags, media, and API keys are permanently deleted.</p>
    <p>You can export your account data in Account Settings before deleting it.</p>
    <Link className="btn btn-primary" href="/settings/account">Open Account Settings</Link>
    <p>If you cannot sign in or a deletion was interrupted, contact <a className="link" href="mailto:nat@natwelch.com">nat@natwelch.com</a>.</p>
  </main>
}
