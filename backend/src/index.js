// backend/src/index.js 

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
const PORT = process.env.PORT || 3001; 

// HTTP Server Setup
const server = http.createServer(app);

// WebSocket Server Setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT"]
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Express Middleware
app.use(cors({
  origin: FRONTEND_URL
}));
app.use(express.json());


app.use('/uploads/proofs', express.static(path.join(__dirname, '..', 'uploads', 'proofs')));


// Express Routes
app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/requests', requestRoutes.default || requestRoutes);
app.use('/api/assignments', assignmentRoutes.default || assignmentRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is running and ready!" });
});


setupSocketHandlers(io);

export { server, io };

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend can connect to: ${FRONTEND_URL}`);
});