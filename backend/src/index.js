// resqwave/backend/src/index.js

import 'dotenv/config'; // Loads environment variables (like PORT) first
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io'; // For real-time chat

// --- IMPORT ROUTES AND PRISMA CLIENT ---
import authRoutes from '../routes/auth.js';
import requestRoutes from '../routes/requests.js';
// Note: We don't strictly need to import prisma client here, 
// but we leave a note for future expansion/testing. 
// import prisma from './client.js'; 


const app = express();
const PORT = process.env.PORT || 3001;

// Setup server for Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allows your React frontend to connect
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(express.json());

// --- USE API ROUTES ---
app.use('/api/auth', authRoutes);     // Handles user/volunteer signup and login
app.use('/api/requests', requestRoutes); // Handles victim submission and admin fetches

// --- Basic Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is running and ready!" });
});


// --- Socket.IO Connection Logic (Real-Time Setup) ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Logic for joining a chat room (Request ID)
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