"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./auth"));
const deposits_1 = __importDefault(require("./deposits"));
const reports_1 = __importDefault(require("./reports"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
const clientUrls = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
console.log('Allowed CORS Origins:', clientUrls);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (clientUrls.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Simotwet Coffee Society API is running' });
});
// App Routes
app.use('/api/auth', auth_1.default);
app.use('/api/deposits', deposits_1.default);
app.use('/api/reports', reports_1.default);
// Serve static uploaded files (PDFs)
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
// Production: Serve static client files
if (process.env.NODE_ENV === 'production') {
    // In production, when running from dist/server/index.js,
    // the client files are located in ../client
    const clientPath = path_1.default.join(__dirname, '../client');
    app.use(express_1.default.static(clientPath));
    // Catch-all for SPA routing - Express 5 requires specific syntax for wildcards
    app.get('{/*path}', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            res.sendFile(path_1.default.join(clientPath, 'index.html'));
        }
    });
}
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
