export interface User {
  id: string
  email: string
  createdAt: string
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
  subscriptionEnd?: string
}

export interface Note {
  id: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface APIKey {
  id: string
  name: string
  key?: string
  createdAt: string
  lastUsed?: string
}

export interface FilterOptions {
  searchQuery: string
  selectedTags: string[]
  dateRange?: {
    start: string
    end: string
  }
}
