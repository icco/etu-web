import { Note } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DotsThree, Pencil, Trash } from '@phosphor-icons/react'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  searchQuery?: string
}

export function NoteCard({ note, onEdit, onDelete, searchQuery }: NoteCardProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getPreview = (content: string, maxLength: number = 200) => {
    const stripped = content.replace(/[#*`\[\]]/g, '')
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + '...'
  }

  const highlightText = (text: string) => {
    if (!searchQuery) return text
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <mark key={i}>{part}</mark> : 
        part
    )
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border group">
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
              >
                <DotsThree size={20} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(note)} className="gap-2">
                <Pencil size={16} />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(note.id)} 
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash size={16} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="text-foreground whitespace-pre-wrap">
          {highlightText(getPreview(note.content))}
        </div>
      </CardContent>
    </Card>
  )
}
