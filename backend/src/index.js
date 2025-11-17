// --- backend/src/index.js (FINAL CORRECTED CODE) ---

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { setupSocketHandlers } from './socket.js';
import authRoutes from '../routes/auth.js';
import requestRoutes from '../routes/requests.js';
import assignmentRoutes from '../routes/assignments.js';

const app = express();
const FRONTEND_URL = "http://localhost:5173";
const PORT = process.env.PORT || 3001; // Defined PORT

// 1. HTTP Server Setup
const server = http.createServer(app);

// 2. WebSocket Server Setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT"]
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 3. Express Middleware
app.use(cors({
  origin: FRONTEND_URL
}));
app.use(express.json());

// Add static path to serve uploaded files for admin review
app.use('/uploads/proofs', express.static(path.join(__dirname, '..', 'uploads', 'proofs')));


// 4. Express Routes
app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/requests', requestRoutes.default || requestRoutes);
app.use('/api/assignments', assignmentRoutes.default || assignmentRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is running and ready!" });
});


// 5. Initialize Socket Handlers
setupSocketHandlers(io);

// ----------------------------------------------------
// 🚨 CRITICAL FIX: The listener MUST be here to keep the process alive
// We must also EXPORT the server and io for use by other modules (like assignments.js)
export { server, io }; // ⬅️ Keep the exports for modularity (used by routes/assignments.js)

// START LISTENING (This keeps the process active)
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend can connect to: ${FRONTEND_URL}`);
});

// NOTE: We REMOVE `export default server;` from the end to avoid confusion
// since the named export `export { server, io };` is cleaner for modular routing.