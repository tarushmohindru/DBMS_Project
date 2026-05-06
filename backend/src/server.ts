import 'dotenv/config';
import app from './app';
import { testConnection } from './config/db';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Carbon Credit Marketplace API running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
