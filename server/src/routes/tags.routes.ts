import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tagService } from '../services/tag.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

const RenameTagSchema = z.object({
  name: z.string().min(1).max(100),
});

const MergeTagsSchema = z.object({
  targetTagId: z.string().uuid(),
});

// GET /tags - List all tags with note counts
router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tags = await tagService.findAll(req.user!.userId);

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      console.error('List tags error:', error);
      res.status(500).json({ success: false, error: 'Failed to list tags' });
    }
  }
);

// PUT /tags/:id - Rename tag
router.put(
  '/:id',
  validate(RenameTagSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const renamed = await tagService.rename(req.user!.userId, req.params.id, req.body.name);

      if (!renamed) {
        res.status(404).json({ success: false, error: 'Tag not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Tag renamed',
      });
    } catch (error) {
      console.error('Rename tag error:', error);
      res.status(500).json({ success: false, error: 'Failed to rename tag' });
    }
  }
);

// DELETE /tags/:id - Delete tag
router.delete(
  '/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await tagService.delete(req.user!.userId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Tag not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Tag deleted',
      });
    } catch (error) {
      console.error('Delete tag error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete tag' });
    }
  }
);

// POST /tags/:id/merge - Merge source tag into target
router.post(
  '/:id/merge',
  validate(MergeTagsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merged = await tagService.merge(
        req.user!.userId,
        req.params.id,
        req.body.targetTagId
      );

      if (!merged) {
        res.status(404).json({ success: false, error: 'Tag not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Tags merged',
      });
    } catch (error) {
      console.error('Merge tags error:', error);
      res.status(500).json({ success: false, error: 'Failed to merge tags' });
    }
  }
);

export default router;
