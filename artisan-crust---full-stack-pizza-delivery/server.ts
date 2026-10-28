import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/src/config/db.js';
import { seedInitialData } from './server/src/config/seed.js';
import { initCronJobs } from './server/src/services/cronService.js';

import authRoutes from './server/src/routes/authRoutes.js';
import menuRoutes from './server/src/routes/menuRoutes.js';
import orderRoutes from './server/src/routes/orderRoutes.js';
import adminRoutes from './server/src/routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Artisan Crust Pizza Backend',
    database: 'active',
    razorpay: 'test_mode'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

async function startServer() {
  try {
    // 1. Connect database & run seeder
    await connectDB();
    await seedInitialData();

    // 2. Start scheduled tasks (e.g. inventory low-stock monitoring)
    initCronJobs();

    // 3. Mount Vite or static files
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      console.log('Mounting Vite dev server middleware on port', PORT);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // 4. Start listening on 0.0.0.0
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🍕 Artisan Crust Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
