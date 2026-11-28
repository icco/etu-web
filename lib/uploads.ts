export const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/flac",
  "audio/aac",
])

export const MAX_IMAGE_COUNT = 10
export const MAX_AUDIO_COUNT = 5
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Files travel base64-encoded (4/3 larger) in one server action body capped at 10mb in next.config.ts.
export const MAX_UPLOAD_TOTAL_BYTES = 7 * 1024 * 1024
export const MAX_AUDIO_BYTES = MAX_UPLOAD_TOTAL_BYTES

export function estimateBase64Size(base64: string): number {
  if (base64.length === 0) return 0
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return (base64.length * 3) / 4 - padding
}
