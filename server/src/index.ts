import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import notesRoutes from './routes/notes.routes.js';
import tagsRoutes from './routes/tags.routes.js';
import apikeysRoutes from './routes/apikeys.routes.js';
import stripeRoutes from './routes/stripe.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Initialize database
initializeDatabase();

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Parse JSON body (except for Stripe webhooks which need raw body)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Raw body for Stripe webhooks
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/api-keys', apikeysRoutes);
app.use('/api/stripe', stripeRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🗒️  Etu API Server                                      ║
║                                                           ║
║   Server running on http://localhost:${PORT}                ║
║   Frontend URL: ${FRONTEND_URL.padEnd(39)}║
║                                                           ║
║   API Endpoints:                                          ║
║   • POST   /api/auth/register     Create account          ║
║   • POST   /api/auth/login        Login                   ║
║   • GET    /api/auth/me           Get current user        ║
║   • GET    /api/notes             List notes              ║
║   • POST   /api/notes             Create note             ║
║   • GET    /api/notes/:id         Get note                ║
║   • PUT    /api/notes/:id         Update note             ║
║   • DELETE /api/notes/:id         Delete note             ║
║   • GET    /api/tags              List tags               ║
║   • PUT    /api/tags/:id          Rename tag              ║
║   • DELETE /api/tags/:id          Delete tag              ║
║   • GET    /api/api-keys          List API keys           ║
║   • POST   /api/api-keys          Create API key          ║
║   • DELETE /api/api-keys/:id      Revoke API key          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
