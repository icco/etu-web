import db from '../db/index.js';

export interface TagWithCount {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
}

export class TagService {
  async findAll(userId: string): Promise<TagWithCount[]> {
    const stmt = db.prepare(`
      SELECT t.id, t.name, t.created_at as createdAt,
             COUNT(nt.note_id) as noteCount
      FROM tags t
      LEFT JOIN note_tags nt ON nt.tag_id = t.id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.name
    `);

    return stmt.all(userId) as TagWithCount[];
  }

  async rename(userId: string, tagId: string, newName: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE tags SET name = ? WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(newName, tagId, userId);
    return result.changes > 0;
  }

  async delete(userId: string, tagId: string): Promise<boolean> {
    // This will cascade delete note_tags entries
    const stmt = db.prepare(`
      DELETE FROM tags WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(tagId, userId);
    return result.changes > 0;
  }

  async merge(userId: string, sourceTagId: string, targetTagId: string): Promise<boolean> {
    // Move all note associations from source to target, then delete source
    const moveStmt = db.prepare(`
      UPDATE OR IGNORE note_tags 
      SET tag_id = ? 
      WHERE tag_id = ? AND note_id IN (
        SELECT note_id FROM note_tags WHERE tag_id = ?
      )
    `);
    moveStmt.run(targetTagId, sourceTagId, sourceTagId);

    // Delete remaining associations (duplicates that were ignored)
    const cleanStmt = db.prepare(`
      DELETE FROM note_tags WHERE tag_id = ?
    `);
    cleanStmt.run(sourceTagId);

    // Delete source tag
    return this.delete(userId, sourceTagId);
  }
}

export const tagService = new TagService();
