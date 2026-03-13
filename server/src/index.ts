import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './auth';
import depositsRouter from './deposits';
import reportsRouter from './reports';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const clientUrls = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
console.log('Allowed CORS Origins:', clientUrls);

app.use(cors({ 
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (clientUrls.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
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
  // In production, when running from dist/server/index.js,
  // the client files are located in ../client
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
  
  // Catch-all for SPA routing - Express 5 requires specific syntax for wildcards
  app.get('{/*path}', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
