import { Note, FilterOptions } from './types'

export function filterNotes(notes: Note[], filters: FilterOptions): Note[] {
  return notes.filter((note) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const contentMatch = note.content.toLowerCase().includes(query)
      const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(query))
      if (!contentMatch && !tagMatch) return false
    }

    if (filters.selectedTags.length > 0) {
      const hasMatchingTag = filters.selectedTags.some((filterTag) =>
        note.tags.includes(filterTag)
      )
      if (!hasMatchingTag) return false
    }

    if (filters.dateRange) {
      const noteDate = new Date(note.createdAt)
      const start = new Date(filters.dateRange.start)
      const end = new Date(filters.dateRange.end)
      if (noteDate < start || noteDate > end) return false
    }

    return true
  })
}

export function groupNotesByDate(notes: Note[]): Map<string, Note[]> {
  const grouped = new Map<string, Note[]>()

  notes.forEach((note) => {
    const date = new Date(note.createdAt)
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(note)
  })

  return grouped
}

export function getAllTags(notes: Note[]): string[] {
  const tagSet = new Set<string>()
  notes.forEach((note) => {
    note.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}

export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
