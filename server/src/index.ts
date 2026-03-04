import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './network/RoomManager';
import { EventRouter } from './network/EventRouter';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Multiplayer network layer
// ---------------------------------------------------------------------------

const roomManager = new RoomManager();
const eventRouter = new EventRouter(io, roomManager);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Wire all client events through the EventRouter
  eventRouter.setupSocketHandlers(socket);

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Note: EventRouter also listens for 'disconnect' internally and handles
    // reconnection windows, room cleanup, and broadcasting. The log here
    // is intentionally kept for server-level visibility.
  });
});

// ---------------------------------------------------------------------------
// Health check endpoint
// ---------------------------------------------------------------------------

app.get('/', (_req, res) => {
  res.json({ name: 'TEG La Revancha Server', status: 'running', client: 'http://localhost:3000' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: roomManager.serializeRoomList().length });
});

httpServer.listen(PORT, () => {
  console.log(`TEG Server running on port ${PORT}`);
});
