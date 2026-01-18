import { Router, Request, Response } from 'express';
import { apiKeyService } from '../services/apikey.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateAPIKeySchema } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api-keys - List all API keys (without the actual keys)
router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKeys = await apiKeyService.findAll(req.user!.userId);

      res.json({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({ success: false, error: 'Failed to list API keys' });
    }
  }
);

// POST /api-keys - Create new API key
router.post(
  '/',
  validate(CreateAPIKeySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { apiKey, rawKey } = await apiKeyService.create(req.user!.userId, req.body);

      // Return the raw key only once - it cannot be retrieved later
      res.status(201).json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: rawKey, // Only returned on creation
          keyPrefix: apiKey.keyPrefix,
          createdAt: apiKey.createdAt,
        },
        message: 'Save this key! It will not be shown again.',
      });
    } catch (error) {
      console.error('Create API key error:', error);
      res.status(500).json({ success: false, error: 'Failed to create API key' });
    }
  }
);

// DELETE /api-keys/:id - Revoke API key
router.delete(
  '/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await apiKeyService.delete(req.user!.userId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'API key not found' });
        return;
      }

      res.json({
        success: true,
        message: 'API key revoked',
      });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ success: false, error: 'Failed to revoke API key' });
    }
  }
);

export default router;
