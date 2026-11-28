import { format } from "date-fns"
import type { Note } from "@/lib/types"

// Groups by the viewer's local day, matching the headings the views render.
export function groupNotesByDate(notes: Note[]): Map<string, Note[]> {
  const grouped = new Map<string, Note[]>()
  notes.forEach((note) => {
    const dateKey = format(new Date(note.createdAt), "yyyy-MM-dd")
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(note)
  })
  return grouped
}
