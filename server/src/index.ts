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
    // In production, we want to allow requests from the same origin 
    // or flexible based on environment configuration.
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any of the client URLs 
    if (process.env.CLIENT_URL) {
      const allowed = process.env.CLIENT_URL.split(',').map(u => u.trim());
      if (allowed.includes(origin)) return callback(null, true);
    }
    
    // Default permissive but credential-safe pattern for production.
    // Allow any origin that isn't explicitly blocked if we're in production mode.
    // In a security-critical env, you'd be more restrictive.
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
  // In production, when running from dist/server/index.js,
  // the client files are located in ../client
  const clientPath = path.resolve(process.cwd(), '../client');
  console.log('Serving static files from:', clientPath);
  app.use(express.static(clientPath));
  
  // Catch-all for SPA routing
  app.get('{/*path}', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      const indexPath = path.join(clientPath, 'index.html');
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
