"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireSubscribedUser } from "@/lib/access"
import {
  getGrpcApiKey,
  notesService,
  tagsService,
  statsService,
  type ImageUpload,
  type AudioUpload,
} from "@/lib/grpc/client"
import { toNote, type Note, type Tag } from "@/lib/types"
import {
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  estimateBase64Size,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_COUNT,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_COUNT,
} from "@/lib/uploads"

const createNoteSchema = z.object({
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).default([]),
})

const updateNoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
})

// Helper to convert base64 image data to ImageUpload format
function parseImageUploads(images?: { data: string; mimeType: string }[]): ImageUpload[] {
  if (!images || images.length === 0) return []

  if (images.length > MAX_IMAGE_COUNT) {
    throw new Error("Too many images uploaded")
  }

  return images.map((img) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(img.mimeType)) {
      throw new Error("Unsupported image MIME type")
    }

    const estimatedBytes = estimateBase64Size(img.data)
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      throw new Error("Image upload exceeds maximum allowed size")
    }

    // Use Buffer.from for more efficient base64 decoding on server
    const buffer = Buffer.from(img.data, "base64")

    return {
      data: new Uint8Array(buffer),
      mimeType: img.mimeType,
    }
  })
}

// Helper to convert base64 audio data to AudioUpload format
function parseAudioUploads(audios?: { data: string; mimeType: string }[]): AudioUpload[] {
  if (!audios || audios.length === 0) return []

  if (audios.length > MAX_AUDIO_COUNT) {
    throw new Error("Too many audio files uploaded")
  }

  return audios.map((audio) => {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(audio.mimeType)) {
      throw new Error("Unsupported audio MIME type")
    }

    const estimatedBytes = estimateBase64Size(audio.data)
    if (estimatedBytes > MAX_AUDIO_BYTES) {
      throw new Error("Audio upload exceeds maximum allowed size")
    }

    // Use Buffer.from for more efficient base64 decoding on server
    const buffer = Buffer.from(audio.data, "base64")

    return {
      data: new Uint8Array(buffer),
      mimeType: audio.mimeType,
    }
  })
}

async function requireUser() {
  return requireSubscribedUser()
}

export async function createNote(data: {
  content: string
  tags: string[]
  images?: { data: string; mimeType: string }[]
  audios?: { data: string; mimeType: string }[]
}) {
  const userId = await requireUser()
  const parsed = createNoteSchema.parse(data)

  const response = await notesService.createNote(
    {
      userId,
      content: parsed.content,
      tags: parsed.tags,
      images: parseImageUploads(data.images),
      audios: parseAudioUploads(data.audios),
    },
    getGrpcApiKey()
  )

  revalidatePath("/notes")
  revalidatePath("/history")
  revalidatePath("/")
  return { id: response.note.id }
}

export async function updateNote(data: {
  id: string
  content?: string
  tags?: string[]
  addImages?: { data: string; mimeType: string }[]
  addAudios?: { data: string; mimeType: string }[]
}) {
  const userId = await requireUser()
  const parsed = updateNoteSchema.parse(data)

  await notesService.updateNote(
    {
      userId,
      id: parsed.id,
      content: parsed.content,
      tags: parsed.tags,
      updateTags: parsed.tags !== undefined,
      addImages: parseImageUploads(data.addImages),
      addAudios: parseAudioUploads(data.addAudios),
    },
    getGrpcApiKey()
  )

  revalidatePath("/notes")
  revalidatePath("/history")
  revalidatePath("/")
  return { success: true }
}

export async function deleteNote(id: string) {
  const userId = await requireUser()

  await notesService.deleteNote(
    {
      userId,
      id,
    },
    getGrpcApiKey()
  )

  revalidatePath("/notes")
  revalidatePath("/history")
  revalidatePath("/")
  return { success: true }
}

export async function getNotes(options?: {
  search?: string
  tags?: string[]
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<{ notes: Note[]; total: number }> {
  const userId = await requireUser()

  const response = await notesService.listNotes(
    {
      userId,
      search: options?.search,
      tags: options?.tags,
      startDate: options?.startDate?.toISOString(),
      endDate: options?.endDate?.toISOString(),
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    },
    getGrpcApiKey()
  )

  return {
    notes: response.notes.map(toNote),
    total: response.total,
  }
}

export async function getRandomNotes(options?: { count?: number }): Promise<Note[]> {
  const userId = await requireUser()

  const response = await notesService.getRandomNotes(
    {
      userId,
      count: options?.count || 5,
    },
    getGrpcApiKey()
  )

  return response.notes.map(toNote)
}

export async function searchNotes(options: { query: string; limit?: number; offset?: number }): Promise<{ notes: Note[]; total: number }> {
  const userId = await requireUser()
  const response = await notesService.searchNotes(
    {
      userId,
      query: options.query.trim(),
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    },
    getGrpcApiKey()
  )
  return {
    notes: response.notes.map(toNote),
    total: response.total,
  }
}

export async function getTags(): Promise<Tag[]> {
  const userId = await requireUser()

  const response = await tagsService.listTags(
    {
      userId,
    },
    getGrpcApiKey()
  )

  return response.tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag.count,
  }))
}

/**
 * Get user-specific stats using the Stats API
 * Returns total blips, unique tags, and words written for the current user
 */
export async function getUserStats() {
  const userId = await requireUser()

  const response = await statsService.getStats(
    { userId },
    getGrpcApiKey()
  )

  return {
    totalBlips: Number(response.totalBlips),
    uniqueTags: Number(response.uniqueTags),
    wordsWritten: Number(response.wordsWritten),
  }
}

/**
 * Get global stats using the Stats API
 * Returns total blips, unique tags, and words written across all users
 */
export async function getGlobalStats() {
  // Empty userId = global stats (backend returns stats for all users when userId is empty)
  const response = await statsService.getStats(
    { userId: "" },
    getGrpcApiKey()
  )

  return {
    totalBlips: Number(response.totalBlips),
    uniqueTags: Number(response.uniqueTags),
    wordsWritten: Number(response.wordsWritten),
  }
}
