import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from cwd first, fallback to backend/.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  jwt: {
    secret: jwtSecret || 'tasknera_ceo_super_secret_jwt_key_2026!',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    databaseUrl: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
};
