import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Note } from '@/lib/types'
import { filterNotes, groupNotesByDate, getAllTags, generateId } from '@/lib/note-utils'
import { NoteDialog } from '@/components/NoteDialog'
import { NoteCard } from '@/components/NoteCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  NotePencil, 
  MagnifyingGlass, 
  SignOut, 
  Gear,
  X 
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SettingsDialog } from '@/components/SettingsDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AppViewProps {
  onLogout: () => void
}

export function AppView({ onLogout }: AppViewProps) {
  const [notes, setNotes] = useKV<Note[]>('etu-notes', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const allTags = useMemo(() => getAllTags(notes || []), [notes])

  const filteredNotes = useMemo(() => {
    return filterNotes(notes || [], {
      searchQuery,
      selectedTags,
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, searchQuery, selectedTags])

  const groupedNotes = useMemo(() => {
    return groupNotesByDate(filteredNotes)
  }, [filteredNotes])

  const handleSaveNote = (content: string, tags: string[]) => {
    if (editingNote) {
      setNotes((currentNotes) =>
        (currentNotes || []).map((note) =>
          note.id === editingNote.id
            ? { ...note, content, tags, updatedAt: new Date().toISOString() }
            : note
        )
      )
      toast.success('Blip updated')
      setEditingNote(null)
    } else {
      const newNote: Note = {
        id: generateId(),
        content,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setNotes((currentNotes) => [newNote, ...(currentNotes || [])])
      toast.success('Blip saved')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setDialogOpen(true)
  }

  const confirmDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteNote = () => {
    if (noteToDelete) {
      setNotes((currentNotes) => (currentNotes || []).filter((note) => note.id !== noteToDelete))
      toast.success('Blip deleted')
      setNoteToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <NotePencil size={28} weight="duotone" className="text-primary" />
              <h1 className="text-xl font-bold text-primary hidden sm:block">Etu</h1>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                />
                <Input
                  id="search-notes"
                  type="search"
                  placeholder="Search blips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingNote(null)
                  setDialogOpen(true)
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <NotePencil size={20} weight="bold" className="sm:mr-2" />
                <span className="hidden sm:inline">New Blip</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Gear size={24} />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <SignOut size={24} />
              </Button>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="border-t border-border">
              <div className="container mx-auto px-4 md:px-6 py-3">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground mr-2">Tags:</span>
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          selectedTags.includes(tag)
                            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {(searchQuery || selectedTags.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1 text-xs"
                      >
                        <X size={14} />
                        Clear
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
          {!notes || notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <NotePencil size={64} weight="duotone" className="text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No blips yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Start your interstitial journaling journey by capturing your first thought.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <NotePencil size={20} weight="bold" className="mr-2" />
                Create Your First Blip
              </Button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MagnifyingGlass size={64} weight="duotone" className="text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No matching blips
              </h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {Array.from(groupedNotes.entries()).map(([date, dateNotes]) => (
                <div key={date}>
                  <div className="sticky top-[73px] bg-background/95 backdrop-blur-sm py-2 mb-4 z-10">
                    <h3 className="text-lg font-semibold text-foreground">{date}</h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-4">
                    {dateNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={confirmDeleteNote}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
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
        title={editingNote ? 'Edit Blip' : 'New Blip'}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blip?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your blip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
