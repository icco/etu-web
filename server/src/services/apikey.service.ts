import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/index.js';
import type { APIKey, CreateAPIKey } from '../types/index.js';

const SALT_ROUNDS = 10;

export class APIKeyService {
  // Generate a new API key with format: etu_<64 hex chars>
  private generateKey(): string {
    return 'etu_' + crypto.randomBytes(32).toString('hex');
  }

  async create(userId: string, data: CreateAPIKey): Promise<{ apiKey: APIKey; rawKey: string }> {
    const id = uuidv4();
    const rawKey = this.generateKey();
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const keyPrefix = rawKey.substring(0, 12); // "etu_" + 8 chars
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userId, data.name, keyHash, keyPrefix, now);

    return {
      apiKey: {
        id,
        userId,
        name: data.name,
        keyHash,
        keyPrefix,
        createdAt: now,
        lastUsed: null,
      },
      rawKey,
    };
  }

  async findAll(userId: string): Promise<Omit<APIKey, 'keyHash'>[]> {
    const stmt = db.prepare(`
      SELECT id, user_id as userId, name, key_prefix as keyPrefix, 
             created_at as createdAt, last_used as lastUsed
      FROM api_keys WHERE user_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(userId) as Omit<APIKey, 'keyHash'>[];
  }

  async verify(rawKey: string): Promise<string | null> {
    // Extract prefix to narrow down search
    const keyPrefix = rawKey.substring(0, 12);

    const stmt = db.prepare(`
      SELECT id, user_id, key_hash FROM api_keys WHERE key_prefix = ?
    `);

    const rows = stmt.all(keyPrefix) as { id: string; user_id: string; key_hash: string }[];

    for (const row of rows) {
      const valid = await bcrypt.compare(rawKey, row.key_hash);
      if (valid) {
        // Update last used timestamp
        this.updateLastUsed(row.id);
        return row.user_id;
      }
    }

    return null;
  }

  private updateLastUsed(keyId: string): void {
    const stmt = db.prepare(`
      UPDATE api_keys SET last_used = datetime('now') WHERE id = ?
    `);
    stmt.run(keyId);
  }

  async delete(userId: string, keyId: string): Promise<boolean> {
    const stmt = db.prepare(`
      DELETE FROM api_keys WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(keyId, userId);
    return result.changes > 0;
  }
}

export const apiKeyService = new APIKeyService();
