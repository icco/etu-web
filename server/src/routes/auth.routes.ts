import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CreateUserSchema, LoginSchema } from '../types/index.js';

const router = Router();

// POST /auth/register - Create new account
router.post(
  '/register',
  validate(CreateUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user already exists
      const existing = await userService.findByEmail(req.body.email);
      if (existing) {
        res.status(409).json({ success: false, error: 'Email already registered' });
        return;
      }

      const user = await userService.create(req.body);
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, error: 'Failed to create account' });
    }
  }
);

// POST /auth/login - Authenticate user
router.post(
  '/login',
  validate(LoginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await userService.findByEmail(req.body.email);
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const valid = await userService.verifyPassword(user, req.body.password);
      if (!valid) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const token = generateToken({ userId: user.id, email: user.email });

      // Don't return password hash
      const { passwordHash: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
);

// GET /auth/me - Get current user
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await userService.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const stats = await userService.getStats(req.user!.userId);

      res.json({
        success: true,
        data: {
          user,
          stats,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, error: 'Failed to get user' });
    }
  }
);

// POST /auth/refresh - Refresh token
router.post(
  '/refresh',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = generateToken({ 
        userId: req.user!.userId, 
        email: req.user!.email 
      });

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ success: false, error: 'Failed to refresh token' });
    }
  }
);

export default router;
