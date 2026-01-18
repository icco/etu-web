import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  subscriptionStatus: z.enum(['active', 'inactive', 'trial', 'cancelled']).default('trial'),
  subscriptionEnd: z.string().datetime().nullable(),
  stripeCustomerId: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

// Note types
export const NoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
});

export type CreateNote = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateNote = z.infer<typeof UpdateNoteSchema>;

// Tag types
export const TagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

export type Tag = z.infer<typeof TagSchema>;

// NoteTag junction
export const NoteTagSchema = z.object({
  noteId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export type NoteTag = z.infer<typeof NoteTagSchema>;

// API Key types
export const APIKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  keyHash: z.string(),
  keyPrefix: z.string(), // First 8 chars for identification
  createdAt: z.string().datetime(),
  lastUsed: z.string().datetime().nullable(),
});

export type APIKey = z.infer<typeof APIKeySchema>;

export const CreateAPIKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export type CreateAPIKey = z.infer<typeof CreateAPIKeySchema>;

// Auth types
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type Login = z.infer<typeof LoginSchema>;

export interface JWTPayload {
  userId: string;
  email: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Query params
export const NotesQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type NotesQuery = z.infer<typeof NotesQuerySchema>;

// Full note with tags for API responses
export interface NoteWithTags extends Omit<Note, 'userId'> {
  tags: string[];
}
