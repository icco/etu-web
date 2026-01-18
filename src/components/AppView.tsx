import { useState, useMemo, useEffect, useCallback } from 'react'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  NotePencil, 
  MagnifyingGlass, 
  SignOut, 
  Gear,
  X,
  CalendarBlank,
  House
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
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  const allTags = useMemo(() => getAllTags(notes || []), [notes])

  const filteredNotes = useMemo(() => {
    return filterNotes(notes || [], {
      searchQuery,
      selectedTags,
      dateRange: dateRange?.from && dateRange?.to ? {
        start: dateRange.from.toISOString(),
        end: dateRange.to.toISOString(),
      } : undefined,
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notes, searchQuery, selectedTags, dateRange])

  // Keyboard shortcuts
  const handleNewNote = useCallback(() => {
    setEditingNote(null)
    setDialogOpen(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // 'n' for new note
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        handleNewNote()
      }

      // '/' to focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        document.getElementById('search-notes')?.focus()
      }

      // Escape to clear filters
      if (e.key === 'Escape') {
        if (searchQuery || selectedTags.length > 0 || dateRange) {
          clearFilters()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleNewNote, searchQuery, selectedTags, dateRange])

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
    setDateRange(undefined)
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || dateRange

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

          {(allTags.length > 0 || notes?.length) && (
            <div className="border-t border-border">
              <div className="container mx-auto px-4 md:px-6 py-3">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 items-center">
                    {/* Date Range Filter */}
                    <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={dateRange ? 'default' : 'outline'}
                          size="sm"
                          className={`gap-1.5 ${dateRange ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                        >
                          <CalendarBlank size={16} />
                          {dateRange?.from && dateRange?.to ? (
                            <span className="hidden sm:inline">
                              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                            </span>
                          ) : (
                            <span className="hidden sm:inline">Date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(range)
                            if (range?.from && range?.to) {
                              setDatePopoverOpen(false)
                            }
                          }}
                          numberOfMonths={1}
                        />
                        {dateRange && (
                          <div className="p-3 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setDateRange(undefined)
                                setDatePopoverOpen(false)
                              }}
                            >
                              Clear dates
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>

                    {allTags.length > 0 && (
                      <>
                        <Separator orientation="vertical" className="h-6" />
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        {allTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            className={`cursor-pointer transition-all duration-150 ${
                              selectedTags.includes(tag)
                                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </>
                    )}
                    
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-1 text-xs ml-2"
                      >
                        <X size={14} />
                        Clear all
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
                    {dateNotes.map((note, index) => (
                      <div 
                        key={note.id} 
                        className="note-card-enter"
                        style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
                      >
                        <NoteCard
                          note={note}
                          onEdit={handleEditNote}
                          onDelete={confirmDeleteNote}
                          searchQuery={searchQuery}
                        />
                      </div>
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
        existingTags={allTags}
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50 pb-safe">
        <div className="flex items-center justify-around py-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 px-4"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <House size={24} />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 px-4"
            onClick={() => document.getElementById('search-notes')?.focus()}
          >
            <MagnifyingGlass size={24} />
            <span className="text-xs">Search</span>
          </Button>
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full w-14 h-14 p-0 shadow-lg -mt-6"
            onClick={handleNewNote}
          >
            <NotePencil size={28} weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 px-4"
            onClick={() => setSettingsOpen(true)}
          >
            <Gear size={24} />
            <span className="text-xs">Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col gap-1 h-auto py-2 px-4"
            onClick={onLogout}
          >
            <SignOut size={24} />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-20 md:hidden" />
    </>
  )
}
