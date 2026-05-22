import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { candleRouter } from './routes/candleRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // CORS configuration - allow specific frontend in production, be permissive in development
  const allowedFrontend = process.env.FRONTEND_ORIGIN;
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV === 'production' && allowedFrontend) {
        return origin === allowedFrontend ? callback(null, true) : callback(new Error('Not allowed by CORS'));
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Request logger for debugging network/API issues
  app.use((req, _res, next) => {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} origin=${req.headers.origin}`);
    next();
  });

  app.use(express.json());

  app.use('/api', candleRouter);

  // Serve static files from flutter web build directory
  const webBuildPath = path.join(__dirname, '../../../build/web');
  app.use(express.static(webBuildPath));

  // Fallback to index.html for single page application routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(webBuildPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('Frontend is building. Please refresh in a moment.');
      }
    });
  });

  // Simple health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);

  return app;
}
