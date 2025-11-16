// resqwave/backend/src/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';


import authRoutes from '../routes/auth.js';
import requestRoutes from '../routes/requests.js';
import assignmentRoutes from '../routes/assignments.js';

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});


app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

app.use('/api/auth', authRoutes.default || authRoutes);
app.use('/api/requests', requestRoutes.default || requestRoutes);
app.use('/api/assignments', assignmentRoutes.default || assignmentRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is running and ready!" });
});


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });


  socket.on('send_message', (data) => {

    socket.to(data.roomId).emit('receive_message', data);
    console.log(`Message sent to room ${data.roomId} by ${data.sender}`);

  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend can connect to: http://localhost:${PORT}`);
});