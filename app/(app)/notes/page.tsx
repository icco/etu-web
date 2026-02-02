import type { Metadata } from "next"
import { Suspense } from "react"
import { getNotes, getTags } from "@/lib/actions/notes"
import { NotesView } from "./notes-view"

export const metadata: Metadata = {
  title: "Notes | Etu",
}

export default async function NotesPage() {
  const [notesData, tags] = await Promise.all([
    getNotes({ limit: 7 }),
    getTags(),
  ])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <NotesView initialNotes={notesData.notes} initialTags={tags} />
    </Suspense>
  )
}
