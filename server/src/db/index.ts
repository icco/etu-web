import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import SCHEMA from './schema.js';

const DB_PATH = process.env.DATABASE_URL || './data/etu.db';

// Ensure data directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase(): void {
  console.log('Initializing database...');
  
  // Split schema into individual statements and execute
  const statements = SCHEMA
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    try {
      db.exec(statement + ';');
    } catch (error) {
      // Ignore errors for CREATE IF NOT EXISTS and triggers that may already exist
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('already exists')) {
        console.error('Schema error:', errorMessage);
      }
    }
  }
  
  console.log('Database initialized successfully');
}

// Export database instance
export default db;

// Helper to run transactions
export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}
