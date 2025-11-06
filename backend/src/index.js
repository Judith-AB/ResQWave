// resqwave/backend/src/index.js (FINAL SERVER CONFIG)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// --- IMPORT ROUTES ---
// Must use the correct path and .js extension
import authRoutes from '../routes/auth.js';
import requestRoutes from '../routes/requests.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Setup server for Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

// --- USE API ROUTES (CRITICAL: Uses .default for robustness) ---
app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/requests', requestRoutes.default || requestRoutes);

// --- Basic Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is running and ready!" });
});


// --- Socket.IO Connection Logic (Initial Setup) ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // add logic for sending/receiving chat messages here 

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

// --- Server Start ---
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend can connect to: http://localhost:${PORT}`);
});