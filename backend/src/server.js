import app from './app.js';
import { config } from './config/index.js';
import { query } from './config/db.js';

const startServer = async () => {
  try {
    // Verify database connectivity
    try {
      await query('SELECT 1;');
      console.log('✅ Connected to CEO Command Centre Database.');
    } catch (dbErr) {
      console.warn('⚠️ Database connection warning:', dbErr.message);
    }

    const port = config.port || 5000;

    app.listen(port, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`👑 TaskNera CEO Command Centre Backend Server Online`);
      console.log(`📡 Environment : ${config.nodeEnv || 'development'}`);
      console.log(`🌐 API Base    : http://127.0.0.1:${port}/api`);
      console.log(`🩺 Health Check: http://127.0.0.1:${port}/api/v1/health`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Protect server from unexpected connection dropouts
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ [Server] Uncaught Exception:', err.message);
});

startServer();
