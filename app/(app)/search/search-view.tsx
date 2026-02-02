"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { createNote, updateNote, deleteNote } from "@/lib/actions/notes"
import { NoteCard } from "@/components/note-card"
import { NoteDialog } from "@/components/note-dialog"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NavSearch } from "@/components/nav-search"
import { UserMenu } from "@/components/user-menu"
import type { Tag } from "@/lib/grpc/client"
import type { Note } from "@/lib/types"

interface SearchViewProps {
  initialNotes: Note[]
  initialTags: Tag[]
  query: string
}

function groupNotesByDate(notes: Note[]): Map<string, Note[]> {
  const grouped = new Map<string, Note[]>()
  notes.forEach((note) => {
    const d = new Date(note.createdAt)
    const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(note)
  })
  return grouped
}

export function SearchView({ initialNotes, initialTags, query }: SearchViewProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const notes = initialNotes
  const allTags = initialTags.map((t) => t.name)
  const groupedNotes = groupNotesByDate(notes)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setEditingNote(null)
        setDialogOpen(true)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSaveNote = async (
    content: string,
    tags: string[],
    newImages: { data: string; mimeType: string }[]
  ) => {
    try {
      if (editingNote) {
        await updateNote({
          id: editingNote.id,
          content,
          tags,
          addImages: newImages.length > 0 ? newImages : undefined,
        })
        toast.success("Blip updated")
      } else {
        await createNote({
          content,
          tags,
          images: newImages.length > 0 ? newImages : undefined,
        })
        toast.success("Blip saved")
      }
      setDialogOpen(false)
      setEditingNote(null)
      router.refresh()
    } catch {
      toast.error("Failed to save blip")
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogOpen(true)
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id)
      toast.success("Blip deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete blip")
    }
  }

  return (
    <>
      <div className="min-h-screen bg-base-200 flex flex-col">
        <Header logoHref="/">
          <Link href="/history" className="btn btn-ghost gap-2">
            <ClockIcon className="h-5 w-5" />
            History
          </Link>
          <NavSearch defaultValue={query} />
          <UserMenu />
        </Header>

        <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
          <div className="mb-6 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Search</h1>
          </div>

          {!query ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-base-content/40 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Search your blips</h2>
              <p className="text-base-content/60 mb-6 max-w-md">
                Use the search box above to find notes by content or keywords.
              </p>
              <NavSearch defaultValue="" className="input input-bordered w-full max-w-md" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MagnifyingGlassIcon className="h-16 w-16 text-base-content/40 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No matching blips</h2>
              <p className="text-base-content/60 mb-6">Try a different search term.</p>
              <NavSearch defaultValue={query} className="input input-bordered w-full max-w-md" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              <p className="text-base-content/60">
                {notes.length} result{notes.length === 1 ? "" : "s"} for &quot;{query}&quot;
              </p>
              {Array.from(groupedNotes.entries()).map(([dateKey, dateNotes]) => (
                <div key={dateKey}>
                  <div className="sticky top-16 bg-base-200/95 backdrop-blur-sm py-2 mb-4 z-10">
                    <h3 className="text-lg font-semibold" suppressHydrationWarning>
                      {format(new Date(dateNotes[0].createdAt), "MMMM d, yyyy")}
                    </h3>
                    <div className="divider my-0" />
                  </div>
                  <div className="space-y-4">
                    {dateNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <div className="fab">
          <button
            onClick={() => {
              setEditingNote(null)
              setDialogOpen(true)
            }}
            className="btn btn-lg btn-circle btn-primary"
            aria-label="Create new note"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>

        <Footer />
      </div>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingNote(null)
        }}
        onSave={handleSaveNote}
        initialContent={editingNote?.content}
        initialTags={editingNote?.tags}
        initialImages={editingNote?.images}
        existingTags={allTags}
        title={editingNote ? "Edit Blip" : "New Blip"}
      />
    </>
  )
}
