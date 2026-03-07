import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './network/RoomManager';
import { EventRouter } from './network/EventRouter';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const app = express();
app.use(cors({ origin: allowedOrigins, credentials: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
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
  res.json({ name: 'TEG La Revancha Server', status: 'running', origins: allowedOrigins });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: roomManager.serializeRoomList().length });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`TEG Server running on port ${PORT}`);
});
