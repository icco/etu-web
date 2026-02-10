/**
 * Security utilities for CSRF protection and origin verification
 */

/**
 * Verify that the request origin matches the expected host
 * Prevents CSRF attacks by checking Origin and Referer headers
 * 
 * @param request - NextRequest object
 * @param allowedOrigins - Array of allowed origins (defaults to AUTH_URL)
 * @returns true if origin is valid, false otherwise
 */
export function verifyOrigin(
  request: Request,
  allowedOrigins?: string[]
): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // Determine allowed origins
  const allowed = allowedOrigins || [process.env.AUTH_URL || ""]
  
  // Remove trailing slashes for comparison
  const normalizedAllowed = allowed.map((o) => o.replace(/\/$/, ""))

  // Check origin header first (preferred)
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "")
    return normalizedAllowed.includes(normalizedOrigin)
  }

  // Fallback to referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      return normalizedAllowed.includes(refererOrigin)
    } catch {
      return false
    }
  }

  // No origin or referer header - reject
  return false
}

/**
 * Check if a request comes from the same origin
 * 
 * @param request - NextRequest object
 * @returns true if same origin, false otherwise
 */
export function isSameOrigin(request: Request): boolean {
  const authUrl = process.env.AUTH_URL
  if (!authUrl) {
    return false
  }

  return verifyOrigin(request, [authUrl])
}

/**
 * Sanitize error messages to avoid leaking sensitive information
 * 
 * @param error - Error object or string
 * @returns Sanitized error message
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // In production, return generic message
    if (process.env.NODE_ENV === "production") {
      return "An error occurred"
    }
    // In development, return the actual message
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  return "An unknown error occurred"
}

/**
 * Check if a string contains potentially sensitive information
 * 
 * @param str - String to check
 * @returns true if potentially sensitive
 */
export function containsSensitiveData(str: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /auth/i,
    /credential/i,
    /private/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // credit card-like
  ]

  return sensitivePatterns.some((pattern) => pattern.test(str))
}

/**
 * Redact sensitive information from a string
 * NOTE: This provides basic protection against common sensitive data patterns.
 * The patterns may have false positives (e.g., matching dates as credit cards).
 * For production use, consider more sophisticated validation or dedicated libraries.
 * 
 * @param str - String to redact
 * @returns Redacted string
 */
export function redactSensitiveData(str: string): string {
  let redacted = str

  // Redact emails (simplified pattern, may have false positives)
  redacted = redacted.replace(
    /\b[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+\b/g,
    "[EMAIL_REDACTED]"
  )

  // Redact potential tokens/keys (long alphanumeric strings, 32+ chars)
  redacted = redacted.replace(
    /\b[A-Za-z0-9_-]{32,}\b/g,
    "[TOKEN_REDACTED]"
  )

  // Redact SSN-like patterns (XXX-XX-XXXX)
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")

  // Redact potential credit card patterns (note: may have false positives)
  // Only matches if it looks like a credit card with spaces or dashes
  redacted = redacted.replace(
    /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g,
    "[CARD_REDACTED]"
  )

  return redacted
}
