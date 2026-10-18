import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'data', 'rooms_db.json');

interface Player {
  id: string;
  name: string;
  team: 'A' | 'B';
  slot: number;
  rating: number;
  roundPoints: number;
  isHost: boolean;
  connected: boolean;
  ability?: string;
  abilityUsed?: boolean;
}

interface GameState {
  room: string;
  phase: 'LOBBY' | 'ROUND_ACTIVE' | 'ROUND_CONCLUDED';
  players: Player[];
  [key: string]: any;
}

// In-memory room cache
const rooms = new Map<string, GameState>();

// Load persistent rooms from disk
function loadRoomsFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      if (data.trim()) {
        const parsed = JSON.parse(data);
        for (const [code, state] of Object.entries(parsed)) {
          rooms.set(code.toUpperCase(), state as GameState);
        }
        console.log(`[Storage] Loaded ${rooms.size} persistent rooms from disk.`);
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to load rooms from disk:', err);
  }
}

// Save persistent rooms to disk
function saveRoomsToDisk() {
  try {
    const obj: Record<string, GameState> = {};
    for (const [code, state] of rooms.entries()) {
      obj[code] = state;
    }
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Failed to save rooms to disk:', err);
  }
}

loadRoomsFromDisk();

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Full CORS support for Expo Go, Mobile browsers, and Cross-Domain devices
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-room-code, x-player-id, X-Room-Code, X-Player-Id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Connected WebSocket clients mapped by room code
  const roomSockets = new Map<string, Set<WebSocket>>();

  function broadcastToRoom(roomId: string, message: any, excludeSocket?: WebSocket) {
    const sockets = roomSockets.get(roomId);
    if (!sockets) return;
    const data = JSON.stringify(message);
    for (const client of sockets) {
      if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (e) {
          console.warn('Error sending to client:', e);
        }
      }
    }
  }

  // --- STANDARD REST API (WORKS OVER 100% OF MOBILE & EXPO NETWORKS) ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
  });

  // 1. Get room state (by route param or header)
  app.get(['/api/rooms/:roomId', '/api/games/rooms/state'], (req, res) => {
    const headerCode = req.headers['x-room-code'] || req.headers['X-Room-Code'];
    const roomId = (req.params.roomId || (typeof headerCode === 'string' ? headerCode : '')).toUpperCase().trim();
    if (!roomId) {
      return res.status(400).json({ error: 'Room code required.' });
    }

    const state = rooms.get(roomId);
    if (!state) {
      return res.status(404).json({ error: `Room ${roomId} not found.` });
    }
    res.json({ success: true, state });
  });

  // 2. Create room
  app.post(['/api/rooms', '/api/games/rooms'], (req, res) => {
    let roomId = '';
    let state: GameState;

    if (req.body.room && req.body.state) {
      roomId = req.body.room.toUpperCase().trim();
      state = req.body.state;
    } else if (req.body.playerId && req.body.name) {
      // Compatibility with Expo Go reference app body
      const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      roomId = Array.from({ length: 4 }, () => codeChars[Math.floor(Math.random() * codeChars.length)]).join('');
      const hostPlayer: Player = {
        id: req.body.playerId,
        name: req.body.name.trim().slice(0, 24) || 'Host',
        team: 'A',
        slot: 0,
        rating: 100,
        roundPoints: 0,
        isHost: true,
        connected: true,
      };
      state = {
        room: roomId,
        phase: 'LOBBY',
        gameMode: 'AKUMA',
        players: [hostPlayer],
        currentTurnIndex: 0,
        rotation: ['p0', 'p1', 'p2', 'p3'],
        roundNumber: 1,
        matchHistory: [],
        commsHistory: [],
        handA: [],
        handB: [],
        cemetery: [],
        deactivatedSuits: [],
        targetCard: null,
        outlawPowerState: null,
        interceptionAlert: null,
        updatedAt: Date.now(),
      };
    } else {
      return res.status(400).json({ error: 'Valid room data required.' });
    }

    state.updatedAt = Date.now();
    rooms.set(roomId, state);
    saveRoomsToDisk();

    console.log(`[Room Created] Room ${roomId} created by ${state.players?.[0]?.name}`);
    res.status(201).json({ success: true, room: roomId, state });
  });

  // 3. Join room (atomic server-authoritative seat allocation)
  app.post(['/api/rooms/:roomId/join', '/api/games/rooms/join'], (req, res) => {
    const rawCode = req.params.roomId || req.body.code || req.body.room;
    if (!rawCode) {
      return res.status(400).json({ error: 'Room code required.' });
    }
    const roomId = String(rawCode).toUpperCase().trim();
    const { playerName, name: refName, playerId: reqPlayerId } = req.body;
    const name = (playerName || refName || 'Guest').trim().slice(0, 24);
    const playerId = reqPlayerId || `player_${Math.random().toString(36).substring(2, 9)}`;

    const state = rooms.get(roomId);
    if (!state) {
      return res.status(404).json({ error: `Room "${roomId}" not found. Check the code and try again.` });
    }

    // Check if player is already in this room (reconnection)
    const existingIndex = state.players.findIndex((p) => p.id === playerId);
    if (existingIndex !== -1) {
      state.players[existingIndex].connected = true;
      state.players[existingIndex].name = name;
      state.updatedAt = Date.now();
      rooms.set(roomId, state);
      saveRoomsToDisk();

      broadcastToRoom(roomId, {
        type: 'STATE_UPDATE',
        room: roomId,
        senderId: playerId,
        state,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        player: state.players[existingIndex],
        state,
      });
    }

    // Allocate next available slot (0: A1, 1: B1, 2: A2, 3: B2)
    const occupiedSlots = new Set(state.players.map((p) => p.slot));
    let availableSlot = -1;
    for (let s = 0; s < 4; s++) {
      if (!occupiedSlots.has(s)) {
        availableSlot = s;
        break;
      }
    }

    if (availableSlot === -1) {
      return res.status(409).json({ error: 'Room is full (all 4 seats are occupied).' });
    }

    const team: 'A' | 'B' = availableSlot % 2 === 0 ? 'A' : 'B';
    const newPlayer: Player = {
      id: playerId,
      name,
      team,
      slot: availableSlot,
      rating: 100,
      roundPoints: 0,
      isHost: false,
      connected: true,
    };

    const updatedState: GameState = {
      ...state,
      players: [...state.players, newPlayer],
      updatedAt: Date.now(),
    };

    rooms.set(roomId, updatedState);
    saveRoomsToDisk();
    console.log(`[Player Joined] ${name} (${playerId}) joined Room ${roomId} on Team ${team} (Slot ${availableSlot})`);

    // Broadcast updated state to all connected devices in this room
    broadcastToRoom(roomId, {
      type: 'STATE_UPDATE',
      room: roomId,
      senderId: playerId,
      state: updatedState,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      player: newPlayer,
      state: updatedState,
    });
  });

  // 4. Update room state (used for turn moves, reveals, guesses, ability triggers)
  app.post(['/api/rooms/:roomId/state', '/api/games/rooms/actions'], (req, res) => {
    const rawCode = req.params.roomId || req.body.code || req.body.room;
    if (!rawCode) {
      return res.status(400).json({ error: 'Room code required.' });
    }
    const roomId = String(rawCode).toUpperCase().trim();
    const { state, senderId } = req.body;

    if (state) {
      state.updatedAt = Date.now();
      rooms.set(roomId, state);
      saveRoomsToDisk();

      broadcastToRoom(roomId, {
        type: 'STATE_UPDATE',
        room: roomId,
        senderId: senderId || '',
        state,
        timestamp: Date.now(),
      });

      return res.json({ success: true, state });
    }

    return res.status(400).json({ error: 'Valid state update required.' });
  });

  // 5. Leave room
  app.post(['/api/rooms/:roomId/leave', '/api/games/rooms/leave'], (req, res) => {
    const rawCode = req.params.roomId || req.body.code;
    const roomId = String(rawCode || '').toUpperCase().trim();
    const playerId = req.body.playerId;

    const state = rooms.get(roomId);
    if (!state) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const remainingPlayers = state.players.filter((p) => p.id !== playerId);
    if (remainingPlayers.length === 0) {
      rooms.delete(roomId);
      saveRoomsToDisk();
      return res.json({ left: true, roomClosed: true });
    }

    if (state.players.find((p) => p.id === playerId)?.isHost) {
      remainingPlayers[0].isHost = true;
    }

    const updatedState: GameState = {
      ...state,
      players: remainingPlayers,
      updatedAt: Date.now(),
    };

    rooms.set(roomId, updatedState);
    saveRoomsToDisk();

    broadcastToRoom(roomId, {
      type: 'STATE_UPDATE',
      room: roomId,
      senderId: playerId,
      state: updatedState,
      timestamp: Date.now(),
    });

    res.json({ left: true, roomClosed: false, state: updatedState });
  });

  // WebSocket Server Setup (Low-latency real-time overlay)
  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (!msg || !msg.room) return;
        const roomId = msg.room.toUpperCase().trim();

        switch (msg.type) {
          case 'JOIN_ROOM': {
            currentRoomId = roomId;
            currentPlayerId = msg.senderId;

            if (!roomSockets.has(roomId)) {
              roomSockets.set(roomId, new Set());
            }
            roomSockets.get(roomId)!.add(ws);

            // Send current room state immediately upon connecting
            const state = rooms.get(roomId);
            if (state) {
              ws.send(JSON.stringify({
                type: 'STATE_UPDATE',
                room: roomId,
                senderId: 'SERVER',
                state,
                timestamp: Date.now(),
              }));
            }
            break;
          }

          case 'STATE_UPDATE': {
            if (msg.state) {
              msg.state.updatedAt = Date.now();
              rooms.set(roomId, msg.state);
              saveRoomsToDisk();
              broadcastToRoom(roomId, msg, ws);
            }
            break;
          }

          case 'CHAT_MESSAGE':
          case 'INTERCEPTION_ALERT': {
            broadcastToRoom(roomId, msg, ws);
            break;
          }
        }
      } catch (err) {
        console.warn('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && roomSockets.has(currentRoomId)) {
        roomSockets.get(currentRoomId)!.delete(ws);
        if (roomSockets.get(currentRoomId)!.size === 0) {
          roomSockets.delete(currentRoomId);
        }
      }
    });

    ws.on('error', (err) => {
      console.warn('WebSocket connection error:', err);
    });
  });

  // Serve static assets or mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] AKUMA Deduction Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Failed to start server:', err);
});
