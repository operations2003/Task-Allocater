import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration - Restrict to configured origins
const configuredOrigins = config.clientUrl
  ? config.clientUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed =
      allowedOrigins.includes(cleanOrigin) ||
      config.nodeEnv === 'development' ||
      cleanOrigin.endsWith('.vercel.app') ||
      /\.vercel\.app$/.test(new URL(origin).hostname);

    if (isAllowed) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'cache-control',
    'Pragma',
    'pragma',
    'Expires',
    'expires',
  ],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable caching for API responses to ensure real-time command centre metrics
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Apply rate limiting
app.use('/api', apiRateLimiter);

// Mount API Routes
app.use('/api', apiRouter);

// Root Health / Info endpoint for deployment verification
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    product: 'TaskNera CEO Command Centre',
    message: 'TaskNera CEO Command Centre Backend API Server Online',
    version: '1.0.0',
    health: '/api/v1/health',
    environment: config.nodeEnv,
    diagnostics: {
      dbConfigured: Boolean(config.db.databaseUrl),
      jwtConfigured: Boolean(process.env.JWT_SECRET),
      clientUrl: config.clientUrl || '(default)',
    },
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
