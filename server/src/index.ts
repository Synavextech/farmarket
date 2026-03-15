import dotenv from 'dotenv';
import path from 'path';
const envPath = path.join(process.cwd(), '.env');
const parentEnvPath = path.join(process.cwd(), '../.env');
console.log('Current working directory:', process.cwd());
console.log('Trying .env at:', envPath);
console.log('Trying parent .env at:', parentEnvPath);
dotenv.config({ path: envPath });
dotenv.config({ path: parentEnvPath });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './auth';
import depositsRouter from './deposits';
import reportsRouter from './reports';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // Check if the origin matches any of the client URLs 
    if (process.env.CLIENT_URL) {
      const allowed = process.env.CLIENT_URL.split(',').map(u => u.trim());
      if (allowed.includes(origin)) return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Simotwet Coffee Society API is running' });
});

// App Routes
app.use('/api/auth', authRouter);
app.use('/api/deposits', depositsRouter);
app.use('/api/reports', reportsRouter);

// Serve static uploaded files (PDFs)
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Production: Serve static client files
if (process.env.NODE_ENV === 'production') {
  // In production (compiled), __dirname is dist/server
  // We want to reach dist/client
  const clientPath = path.resolve(__dirname, '../client');
  console.log('Serving static files from:', clientPath);

  // Serve static assets first
  app.use(express.static(clientPath, {
    maxAge: '1d',
    etag: true
  }));

  // Catch-all for SPA routing - fixed for Express 5 using middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only handle GET requests that aren't for API or uploads
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      const indexPath = path.join(clientPath, 'index.html');
      return res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error sending index.html:', err);
          res.status(500).send('Error loading application. Please ensure the build is complete.');
        }
      });
    }
    next();
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
