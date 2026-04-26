import authRoutes from './routes/auth';
import examRoutes from './routes/exams';
import reminderRoutes from './routes/reminders';
import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import passport from 'passport';
import './config/passport';

// Database initialization
import { initAdminUser } from './db/initAdminUser';

// Stripe related import add here

//import api routes here

// Configuration
import { SERVER_CONFIG } from './config/constants';

// Middleware
import { errorHandler } from './middleware/errorHandler';

const app = express();

/**
 * Static Files
 */
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, path) => {
      // Disable caching for CSS and JS files to ensure changes are reflected immediately
      if (path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, path) => {
      // Disable caching for CSS and JS files in assets folder
      if (path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

// API Routes import here
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/reminders', reminderRoutes);

/**
 * Install Stripe Routes here
 */

/**
 * SPA Fallback Route
 * Handles client-side routing for React Router
 * Must be registered after all API routes
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

/**
 * Error Handler
 * Must be the last middleware
 */
app.use(errorHandler as ErrorRequestHandler);

/**
 * Start Server
 */
// Initialize admin user before starting server
initAdminUser().then(() => {
  app.listen(SERVER_CONFIG.PORT, () => {
    console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize admin user:', error);
  process.exit(1);
});

export default app;
