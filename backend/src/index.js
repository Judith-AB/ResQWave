
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import { setupSocketHandlers } from './socket.js';
import authRoutes from '../routes/auth.js';
import requestRoutes from '../routes/requests.js';
import assignmentRoutes from '../routes/assignments.js';

const app = express();
const PORT = process.env.PORT || 3001; 
const FRONTEND_URL = "http://localhost:5173";

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT"]
  }
});


app.use(cors({
  origin: FRONTEND_URL
}));
app.use(express.json());


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
