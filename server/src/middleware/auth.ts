import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { apiKeyService } from '../services/apikey.service.js';
import type { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Authentication middleware - supports both JWT and API keys
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, error: 'No authorization header' });
    return;
  }

  // Bearer token (JWT)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
    return;
  }

  // API Key
  if (authHeader.startsWith('ApiKey ') || authHeader.startsWith('etu_')) {
    const apiKey = authHeader.startsWith('ApiKey ') 
      ? authHeader.substring(7) 
      : authHeader;

    const userId = await apiKeyService.verify(apiKey);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Invalid API key' });
      return;
    }

    req.user = { userId, email: '' }; // Email not available from API key
    next();
    return;
  }

  res.status(401).json({ success: false, error: 'Invalid authorization format' });
}

// Optional authentication - doesn't fail if no auth provided
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  // Try to authenticate but don't fail if it doesn't work
  try {
    await authenticate(req, res, () => {
      next();
    });
  } catch {
    next();
  }
}
