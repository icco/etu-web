import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X } from '@phosphor-icons/react'

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (content: string, tags: string[]) => void
  initialContent?: string
  initialTags?: string[]
  title?: string
  existingTags?: string[]
}

export function NoteDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialContent = '', 
  initialTags = [],
  title = 'New Blip',
  existingTags = []
}: NoteDialogProps) {
  const [content, setContent] = useState(initialContent)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialTags)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when dialog opens with new content
  useEffect(() => {
    if (open) {
      setContent(initialContent)
      setTags(initialTags)
      setTagInput('')
      setActiveTab('write')
      // Focus textarea after a short delay to ensure dialog is mounted
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open, initialContent, initialTags])

  // Filter existing tags for autocomplete
  const filteredSuggestions = existingTags.filter(
    (t) => 
      t.toLowerCase().includes(tagInput.toLowerCase()) && 
      !tags.includes(t)
  )

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim(), tags)
      setContent('')
      setTags([])
      setTagInput('')
      onOpenChange(false)
    }
  }

  const handleAddTag = (tagToAdd?: string) => {
    const trimmedTag = (tagToAdd || tagInput).trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
      setTagPopoverOpen(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setTagPopoverOpen(false)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="flex-1 flex flex-col gap-4 mt-0">
            <Textarea
              ref={textareaRef}
              id="note-content"
              placeholder="Write your thoughts in Markdown... (Cmd+Enter to save)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="flex-1 min-h-[300px] font-mono text-sm resize-none"
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 mt-0">
            <div className="border border-border rounded-md p-4 min-h-[300px] bg-card prose prose-sm max-w-none">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content) as string) }} />
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="tag-input">Tags</Label>
          <div className="flex gap-2">
            <Popover open={tagPopoverOpen && filteredSuggestions.length > 0} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <Input
                  id="tag-input"
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value)
                    setTagPopoverOpen(e.target.value.length > 0)
                  }}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => tagInput && setTagPopoverOpen(true)}
                  autoComplete="off"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[200px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command>
                  <CommandList>
                    <CommandEmpty>No matching tags</CommandEmpty>
                    <CommandGroup>
                      {filteredSuggestions.slice(0, 5).map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => handleAddTag(tag)}
                        >
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button type="button" onClick={() => handleAddTag()} variant="secondary">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1 animate-in fade-in zoom-in-95 duration-150">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!content.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Save Blip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
