"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { deleteAccount, updateAiPreference } from "@/lib/actions/account"

export function AccountDataControls({ aiEnabled }: { aiEnabled: boolean }) {
  const [enabled, setEnabled] = useState(aiEnabled)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function toggle(value: boolean) {
    setBusy(true)
    setEnabled(value)
    try {
      const result = await updateAiPreference(value)
      if (result.error) {
        setEnabled(!value)
        toast.error(result.error)
      }
      else {
        toast.success("AI preference updated")
      }
    } catch {
      setEnabled(!value)
      toast.error("Unable to update AI preference")
    } finally {
      setBusy(false)
    }
  }

  async function remove(formData: FormData) {
    setDeleting(true)
    setError("")
    try {
      const result = await deleteAccount(formData)
      if (result.error) setError(result.error)
      else await signOut({ callbackUrl: "/login" })
    } catch {
      setError("Unable to delete account")
    } finally {
      setDeleting(false)
    }
  }

  return <>
    <section className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">AI processing</h2>
        <p>Opt in to automatic tags, image text extraction, and audio transcription using Google Vertex AI. Processing requires a subscription and is subject to daily limits.</p>
        <label className="label cursor-pointer justify-start gap-3">
          <input type="checkbox" className="toggle" checked={enabled} disabled={busy} onChange={(event) => void toggle(event.target.checked)} />
          Enable AI processing
        </label>
      </div>
    </section>
    <section className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Full account export</h2>
        <p>Download your profile, settings, tags, and every note. Image and audio download links expire after one hour; save the media before they expire.</p>
        <a className="btn btn-outline" href="/api/account/export" download>Export Account Data</a>
      </div>
    </section>
    <section className="card bg-base-100 shadow-xl">
      <form onSubmit={(event) => {
        event.preventDefault()
        void remove(new FormData(event.currentTarget))
      }} className="card-body">
        <h2 className="card-title">Delete account</h2>
        <p>This permanently deletes your notes, media, API keys, and account, and cancels your subscription. This cannot be undone.</p>
        <label className="form-control">Password to delete account
          <input className="input input-bordered" type="password" name="password" autoComplete="current-password" required disabled={deleting} />
        </label>
        <label className="label cursor-pointer justify-start gap-3">
          <input className="checkbox" type="checkbox" name="confirmed" required disabled={deleting} />
          I understand this permanently deletes my account and data
        </label>
        {error && <p role="alert" className="text-error">{error}</p>}
        <button className="btn btn-error" type="submit" disabled={deleting}>Permanently delete account</button>
      </form>
    </section>
  </>
}
