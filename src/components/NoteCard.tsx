import { useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Note } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DotsThree, Pencil, Trash } from '@phosphor-icons/react'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  searchQuery?: string
}

export function NoteCard({ note, onEdit, onDelete, searchQuery }: NoteCardProps) {
  const [viewOpen, setViewOpen] = useState(false)

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getPreview = (content: string, maxLength: number = 200) => {
    // Strip markdown for preview but keep some structure
    const stripped = content
      .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^\s*[-*+]\s+/gm, '• ') // List items
      .trim()
    
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + '...'
  }

  const highlightText = (text: string) => {
    if (!searchQuery) return text
    
    try {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'))
      return parts.map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? 
          <mark key={i}>{part}</mark> : 
          part
      )
    } catch {
      return text
    }
  }

  const renderMarkdown = (content: string) => {
    return DOMPurify.sanitize(marked.parse(content) as string)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open view if clicking on the dropdown menu
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) return
    setViewOpen(true)
  }

  return (
    <>
      <Card 
        className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border group cursor-pointer active:scale-[0.99]"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">
                {formatTime(note.createdAt)}
              </div>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {highlightText(tag)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  data-dropdown-trigger
                  onClick={(e) => e.stopPropagation()}
                >
                  <DotsThree size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(note); }} className="gap-2">
                  <Pencil size={16} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} 
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="text-foreground leading-relaxed">
            {highlightText(getPreview(note.content))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium text-muted-foreground">
                {formatFullDate(note.createdAt)}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div 
              className="prose prose-sm max-w-none 
                prose-headings:font-heading prose-headings:text-foreground
                prose-p:text-foreground prose-p:leading-relaxed
                prose-a:text-accent hover:prose-a:text-accent/80
                prose-strong:text-foreground
                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-muted prose-pre:border prose-pre:border-border
                prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground
                prose-li:text-foreground"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }} 
            />
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => { setViewOpen(false); onEdit(note); }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Pencil size={16} className="mr-2" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
