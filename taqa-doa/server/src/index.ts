import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/environment';
import { testConnection } from './config/database';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import calculatorRoutes from './routes/calculator.routes';
import browseRoutes from './routes/browse.routes';
import settingsRoutes from './routes/settings.routes';
import glossaryRoutes from './routes/glossary.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Security headers
app.use(helmet());

// CORS – in development allow any origin for flexible local testing
app.use(
  cors({
    origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);

// Request logging
app.use(requestLogger);

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/api/v1/health', async (_req, res) => {
  try {
    const dbResult = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        connected: true,
        serverTime: dbResult.rows[0].now,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
    });
  }
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Auth routes (handle their own auth validation internally)
app.use('/api/v1/auth', authRoutes);

// Data routes — require authentication
app.use('/api/v1/calculator', requireAuth, calculatorRoutes);
app.use('/api/v1/browse', requireAuth, browseRoutes);
app.use('/api/v1/settings', requireAuth, settingsRoutes);
app.use('/api/v1/glossary', requireAuth, glossaryRoutes);
app.use('/api/v1/admin', adminRoutes);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// Catch-all for unknown routes
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[server] TAQA DOA API running on port ${PORT} (${env.NODE_ENV})`);
});

export default app;
