import { Router, Request, Response } from 'express';
import { noteService } from '../services/note.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateNoteSchema, UpdateNoteSchema, NotesQuerySchema, NotesQuery } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /notes - List notes with filtering
router.get(
  '/',
  validate(NotesQuerySchema, 'query'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const query = (req as Request & { validatedQuery: NotesQuery }).validatedQuery || req.query as unknown as NotesQuery;
      const { notes, total } = await noteService.findAll(req.user!.userId, query);

      res.json({
        success: true,
        data: {
          notes,
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: (query.offset || 0) + notes.length < total,
        },
      });
    } catch (error) {
      console.error('List notes error:', error);
      res.status(500).json({ success: false, error: 'Failed to list notes' });
    }
  }
);

// POST /notes - Create note
router.post(
  '/',
  validate(CreateNoteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const note = await noteService.create(req.user!.userId, req.body);

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ success: false, error: 'Failed to create note' });
    }
  }
);

// GET /notes/:id - Get single note
router.get(
  '/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const note = await noteService.findById(req.user!.userId, req.params.id);

      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found' });
        return;
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      console.error('Get note error:', error);
      res.status(500).json({ success: false, error: 'Failed to get note' });
    }
  }
);

// PUT /notes/:id - Update note
router.put(
  '/:id',
  validate(UpdateNoteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const note = await noteService.update(req.user!.userId, req.params.id, req.body);

      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found' });
        return;
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ success: false, error: 'Failed to update note' });
    }
  }
);

// DELETE /notes/:id - Delete note
router.delete(
  '/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await noteService.delete(req.user!.userId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Note not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Note deleted',
      });
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete note' });
    }
  }
);

export default router;
