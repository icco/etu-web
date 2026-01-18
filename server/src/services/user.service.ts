import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import type { User, CreateUser } from '../types/index.js';

const SALT_ROUNDS = 12;

export class UserService {
  async create(data: CreateUser): Promise<Omit<User, 'passwordHash'>> {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at, subscription_status)
      VALUES (?, ?, ?, ?, ?, 'trial')
    `);

    stmt.run(id, data.email, passwordHash, now, now);

    return {
      id,
      email: data.email,
      createdAt: now,
      updatedAt: now,
      subscriptionStatus: 'trial',
      subscriptionEnd: null,
      stripeCustomerId: null,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, email, password_hash as passwordHash, created_at as createdAt, 
             updated_at as updatedAt, subscription_status as subscriptionStatus,
             subscription_end as subscriptionEnd, stripe_customer_id as stripeCustomerId
      FROM users WHERE email = ?
    `);

    const row = stmt.get(email) as User | undefined;
    return row || null;
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const stmt = db.prepare(`
      SELECT id, email, created_at as createdAt, updated_at as updatedAt,
             subscription_status as subscriptionStatus, subscription_end as subscriptionEnd,
             stripe_customer_id as stripeCustomerId
      FROM users WHERE id = ?
    `);

    const row = stmt.get(id) as Omit<User, 'passwordHash'> | undefined;
    return row || null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateSubscription(
    userId: string,
    status: User['subscriptionStatus'],
    endDate: string | null,
    stripeCustomerId?: string
  ): Promise<void> {
    const stmt = db.prepare(`
      UPDATE users 
      SET subscription_status = ?, subscription_end = ?, stripe_customer_id = COALESCE(?, stripe_customer_id)
      WHERE id = ?
    `);

    stmt.run(status, endDate, stripeCustomerId, userId);
  }

  async findByStripeCustomerId(customerId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const stmt = db.prepare(`
      SELECT id, email, created_at as createdAt, updated_at as updatedAt,
             subscription_status as subscriptionStatus, subscription_end as subscriptionEnd,
             stripe_customer_id as stripeCustomerId
      FROM users WHERE stripe_customer_id = ?
    `);

    const row = stmt.get(customerId) as Omit<User, 'passwordHash'> | undefined;
    return row || null;
  }

  async getStats(userId: string): Promise<{
    totalNotes: number;
    totalTags: number;
    totalWords: number;
    firstNoteDate: string | null;
  }> {
    const notesStmt = db.prepare(`
      SELECT COUNT(*) as count, MIN(created_at) as firstNote
      FROM notes WHERE user_id = ?
    `);
    const notesResult = notesStmt.get(userId) as { count: number; firstNote: string | null };

    const tagsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM tags WHERE user_id = ?
    `);
    const tagsResult = tagsStmt.get(userId) as { count: number };

    const wordsStmt = db.prepare(`
      SELECT content FROM notes WHERE user_id = ?
    `);
    const notes = wordsStmt.all(userId) as { content: string }[];
    const totalWords = notes.reduce((acc, note) => {
      return acc + note.content.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);

    return {
      totalNotes: notesResult.count,
      totalTags: tagsResult.count,
      totalWords,
      firstNoteDate: notesResult.firstNote,
    };
  }
}

export const userService = new UserService();
