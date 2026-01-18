import { v4 as uuidv4 } from 'uuid';
import db, { transaction } from '../db/index.js';
import type { Note, CreateNote, UpdateNote, NotesQuery, NoteWithTags } from '../types/index.js';

export class NoteService {
  async create(userId: string, data: CreateNote): Promise<NoteWithTags> {
    const id = uuidv4();
    const now = new Date().toISOString();

    return transaction(() => {
      // Insert note
      const noteStmt = db.prepare(`
        INSERT INTO notes (id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      noteStmt.run(id, userId, data.content, now, now);

      // Handle tags
      const tags = data.tags || [];
      for (const tagName of tags) {
        this.addTagToNote(userId, id, tagName);
      }

      return {
        id,
        content: data.content,
        createdAt: now,
        updatedAt: now,
        tags,
      };
    });
  }

  async findById(userId: string, noteId: string): Promise<NoteWithTags | null> {
    const noteStmt = db.prepare(`
      SELECT id, content, created_at as createdAt, updated_at as updatedAt
      FROM notes WHERE id = ? AND user_id = ?
    `);

    const note = noteStmt.get(noteId, userId) as Omit<Note, 'userId'> | undefined;
    if (!note) return null;

    const tags = this.getTagsForNote(noteId);
    return { ...note, tags };
  }

  async findAll(userId: string, query: NotesQuery): Promise<{ notes: NoteWithTags[]; total: number }> {
    let whereClause = 'WHERE n.user_id = ?';
    const params: (string | number)[] = [userId];

    // Full-text search
    if (query.search) {
      whereClause += ` AND n.id IN (
        SELECT notes.id FROM notes 
        JOIN notes_fts ON notes.rowid = notes_fts.rowid 
        WHERE notes_fts MATCH ?
      )`;
      params.push(query.search);
    }

    // Tag filter
    if (query.tags) {
      const tagNames = query.tags.split(',').map(t => t.trim());
      const placeholders = tagNames.map(() => '?').join(',');
      whereClause += ` AND n.id IN (
        SELECT nt.note_id FROM note_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE t.name IN (${placeholders})
      )`;
      params.push(...tagNames);
    }

    // Date range
    if (query.startDate) {
      whereClause += ' AND n.created_at >= ?';
      params.push(query.startDate);
    }
    if (query.endDate) {
      whereClause += ' AND n.created_at <= ?';
      params.push(query.endDate);
    }

    // Get total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM notes n ${whereClause}
    `);
    const countResult = countStmt.get(...params) as { total: number };

    // Get notes with pagination
    const notesStmt = db.prepare(`
      SELECT n.id, n.content, n.created_at as createdAt, n.updated_at as updatedAt
      FROM notes n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const notes = notesStmt.all(...params, query.limit, query.offset) as Omit<Note, 'userId'>[];

    // Get tags for each note
    const notesWithTags: NoteWithTags[] = notes.map(note => ({
      ...note,
      tags: this.getTagsForNote(note.id),
    }));

    return { notes: notesWithTags, total: countResult.total };
  }

  async update(userId: string, noteId: string, data: UpdateNote): Promise<NoteWithTags | null> {
    return transaction(() => {
      // Check note exists and belongs to user
      const existing = this.findByIdSync(userId, noteId);
      if (!existing) return null;

      // Update content if provided
      if (data.content !== undefined) {
        const updateStmt = db.prepare(`
          UPDATE notes SET content = ? WHERE id = ? AND user_id = ?
        `);
        updateStmt.run(data.content, noteId, userId);
      }

      // Update tags if provided
      if (data.tags !== undefined) {
        // Remove existing tags
        const deleteTagsStmt = db.prepare(`DELETE FROM note_tags WHERE note_id = ?`);
        deleteTagsStmt.run(noteId);

        // Add new tags
        for (const tagName of data.tags) {
          this.addTagToNote(userId, noteId, tagName);
        }
      }

      // Return updated note
      return this.findByIdSync(userId, noteId);
    });
  }

  async delete(userId: string, noteId: string): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM notes WHERE id = ? AND user_id = ?`);
    const result = stmt.run(noteId, userId);
    return result.changes > 0;
  }

  private findByIdSync(userId: string, noteId: string): NoteWithTags | null {
    const noteStmt = db.prepare(`
      SELECT id, content, created_at as createdAt, updated_at as updatedAt
      FROM notes WHERE id = ? AND user_id = ?
    `);

    const note = noteStmt.get(noteId, userId) as Omit<Note, 'userId'> | undefined;
    if (!note) return null;

    const tags = this.getTagsForNote(noteId);
    return { ...note, tags };
  }

  private getTagsForNote(noteId: string): string[] {
    const stmt = db.prepare(`
      SELECT t.name FROM tags t
      JOIN note_tags nt ON nt.tag_id = t.id
      WHERE nt.note_id = ?
      ORDER BY t.name
    `);

    const rows = stmt.all(noteId) as { name: string }[];
    return rows.map(r => r.name);
  }

  private addTagToNote(userId: string, noteId: string, tagName: string): void {
    // Get or create tag
    const tagId = this.getOrCreateTag(userId, tagName);

    // Link tag to note
    const linkStmt = db.prepare(`
      INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)
    `);
    linkStmt.run(noteId, tagId);
  }

  private getOrCreateTag(userId: string, tagName: string): string {
    // Try to find existing tag
    const findStmt = db.prepare(`
      SELECT id FROM tags WHERE user_id = ? AND name = ?
    `);
    const existing = findStmt.get(userId, tagName) as { id: string } | undefined;

    if (existing) {
      return existing.id;
    }

    // Create new tag
    const tagId = uuidv4();
    const now = new Date().toISOString();
    const createStmt = db.prepare(`
      INSERT INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)
    `);
    createStmt.run(tagId, userId, tagName, now);

    return tagId;
  }
}

export const noteService = new NoteService();
