"use client"

/**
 * Client-side API wrapper for Etu Server REST API
 * This replaces server actions with direct API calls
 */

interface Note {
  id: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Tag {
  id: string
  name: string
  count: number
  createdAt: string
}

interface ListNotesResponse {
  notes: Note[]
  total: number
  limit: number
  offset: number
}

interface ListTagsResponse {
  tags: Tag[]
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api/v1") {
    this.baseUrl = baseUrl
  }

  private async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = new Headers(options.headers)
    headers.set("Content-Type", "application/json")

    // For web UI, use session-based auth instead of API key
    // The session cookie will be sent automatically
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response
  }

  async listNotes(params?: {
    search?: string
    tags?: string[]
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }): Promise<ListNotesResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.search) searchParams.set("search", params.search)
    if (params?.tags?.length) searchParams.set("tags", params.tags.join(","))
    if (params?.startDate) searchParams.set("start_date", params.startDate.toISOString())
    if (params?.endDate) searchParams.set("end_date", params.endDate.toISOString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.offset) searchParams.set("offset", params.offset.toString())

    const query = searchParams.toString()
    const endpoint = query ? `/notes?${query}` : "/notes"
    
    const response = await this.fetch(endpoint)
    return response.json()
  }

  async createNote(data: { content: string; tags?: string[] }): Promise<Note> {
    const response = await this.fetch("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async getNote(id: string): Promise<Note> {
    const response = await this.fetch(`/notes/${id}`)
    return response.json()
  }

  async updateNote(
    id: string,
    data: { content?: string; tags?: string[] }
  ): Promise<Note> {
    const response = await this.fetch(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async deleteNote(id: string): Promise<{ success: boolean }> {
    const response = await this.fetch(`/notes/${id}`, {
      method: "DELETE",
    })
    return response.json()
  }

  async listTags(): Promise<ListTagsResponse> {
    const response = await this.fetch("/tags")
    return response.json()
  }
}

// Export singleton instance
export const api = new ApiClient()

// Export types
export type { Note, Tag, ListNotesResponse, ListTagsResponse }
