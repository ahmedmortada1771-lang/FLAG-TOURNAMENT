import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { FIFA_COUNTRIES } from "./src/data/fifaCountries";

interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  currentQuestionIndex: number;
  finished: boolean;
  totalCorrect: number;
  totalTimeMs: number;
  avatarSeed: number;
}

interface Question {
  id: number;
  targetCountry: any;
  choices: any[];
  correctIndex: number;
}

interface OnlineRoom {
  code: string;
  hostId: string;
  continent: string;
  gameMode: string;
  questionCount: number;
  maxPlayers: number;
  status: "lobby" | "playing" | "finished";
  players: OnlinePlayer[];
  questions: Question[];
  createdAt: number;
}

const app = express();
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// In-memory Room Store
const roomsMap = new Map<string, OnlineRoom>();
// Map of roomCode -> Set of WebSockets
const roomSockets = new Map<string, Set<WebSocket>>();
// In-memory Registered Players Store (lowerName -> playerId)
const registeredNames = new Map<string, string>();

function isPlayerNameTaken(name: string, playerId: string): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return false;

  const existingPid = registeredNames.get(lower);
  if (existingPid && existingPid !== playerId) {
    return true;
  }

  for (const room of roomsMap.values()) {
    for (const player of room.players) {
      if (player.name.trim().toLowerCase() === lower && player.id !== playerId) {
        return true;
      }
    }
  }

  return false;
}

function registerPlayerName(name: string, playerId: string): void {
  const lower = name.trim().toLowerCase();
  if (lower) {
    registeredNames.set(lower, playerId);
  }
}

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 10; i++) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!roomsMap.has(code)) return code;
  }
  return code;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuestionsForRoom(continent: string, count: number = 20, gameMode: string = "classic"): Question[] {
  let pool = FIFA_COUNTRIES;
  if (continent && continent !== "All") {
    const filtered = FIFA_COUNTRIES.filter((c) => c.continent === continent);
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  // If timeattack or survival, generate larger question pool
  const isInfiniteMode = gameMode === "timeattack" || gameMode === "survival";
  const actualCount = isInfiniteMode ? Math.max(100, pool.length) : count;

  let targets: any[] = [];
  if (gameMode === "tournament") {
    // Sort by difficulty ascending so questions get progressively harder, then cycle/shuffle if needed
    const sorted = [...pool].sort((a, b) => a.difficulty - b.difficulty);
    targets = sorted.slice(0, Math.min(actualCount, sorted.length));
    if (targets.length < actualCount) {
      const extra = shuffle(pool).slice(0, actualCount - targets.length);
      targets = [...targets, ...extra];
    }
  } else {
    const shuffledPool = shuffle(pool);
    targets = shuffledPool.slice(0, Math.min(actualCount, shuffledPool.length));
  }

  return targets.map((target, idx) => {
    let distractorPool: any[] = [];
    if (continent && continent !== "All") {
      distractorPool = FIFA_COUNTRIES.filter(
        (c) => c.continent === continent && c.id !== target.id
      );
    } else {
      distractorPool = FIFA_COUNTRIES.filter((c) => c.id !== target.id);
    }

    const chosenDistractors = shuffle(distractorPool).slice(0, 3);
    const choices = shuffle([target, ...chosenDistractors]);
    const correctIndex = choices.findIndex((c) => c.id === target.id);

    return {
      id: idx + 1,
      targetCountry: target,
      choices,
      correctIndex,
    };
  });
}

function broadcastRoomUpdate(roomCode: string) {
  const room = roomsMap.get(roomCode);
  if (!room) return;

  const sockets = roomSockets.get(roomCode);
  if (!sockets) return;

  const payload = JSON.stringify({ type: "ROOM_UPDATE", room });
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// REST API Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", activeRooms: roomsMap.size });
});

// Register / Validate Player Name
app.post("/api/players/register-name", (req, res) => {
  const { name, playerId } = req.body;
  if (!name || !playerId) {
    return res.status(400).json({ error: "Name and playerId are required" });
  }

  const trimmedName = String(name).trim();
  if (trimmedName.length < 3 || trimmedName.length > 12) {
    return res.status(400).json({ error: "Player name must be between 3 and 12 characters" });
  }

  if (isPlayerNameTaken(trimmedName, String(playerId))) {
    return res.status(400).json({ error: "This name is already used, try another name" });
  }

  registerPlayerName(trimmedName, String(playerId));
  res.json({ success: true, name: trimmedName });
});

// Create Room
app.post("/api/rooms/create", (req, res) => {
  const { hostId, hostName, continent = "All", gameMode = "classic", questionCount = 20 } = req.body;

  if (!hostId || !hostName) {
    return res.status(400).json({ error: "Host ID and Name are required" });
  }

  const trimmedName = String(hostName).trim();
  if (trimmedName.length < 3 || trimmedName.length > 12) {
    return res.status(400).json({ error: "Player name must be between 3 and 12 characters" });
  }

  if (isPlayerNameTaken(trimmedName, String(hostId))) {
    return res.status(400).json({ error: "This name is already used, try another name" });
  }

  registerPlayerName(trimmedName, String(hostId));

  const code = generateRoomCode();
  const questions = generateQuestionsForRoom(continent, questionCount, gameMode);

  const newRoom: OnlineRoom = {
    code,
    hostId,
    continent,
    gameMode,
    questionCount: questions.length,
    maxPlayers: 15,
    status: "lobby",
    players: [
      {
        id: hostId,
        name: trimmedName,
        isHost: true,
        score: 0,
        currentQuestionIndex: 0,
        finished: false,
        totalCorrect: 0,
        totalTimeMs: 0,
        avatarSeed: Math.floor(Math.random() * 100),
      },
    ],
    questions,
    createdAt: Date.now(),
  };

  roomsMap.set(code, newRoom);
  res.json({ roomCode: code, room: newRoom });
});

// Join Room
app.post("/api/rooms/join", (req, res) => {
  const { code, playerId, playerName } = req.body;

  if (!code || !playerId || !playerName) {
    return res.status(400).json({ error: "Code, Player ID, and Player Name are required" });
  }

  const trimmedCode = String(code).trim();
  const room = roomsMap.get(trimmedCode);

  if (!room) {
    return res.status(404).json({ error: "Room not found. Please check the 6-digit code." });
  }

  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: "Room is full (Maximum 15 players allowed)." });
  }

  const trimmedName = String(playerName).trim();
  if (trimmedName.length < 3 || trimmedName.length > 12) {
    return res.status(400).json({ error: "Player name must be between 3 and 12 characters" });
  }

  if (isPlayerNameTaken(trimmedName, String(playerId))) {
    return res.status(400).json({ error: "This name is already used, try another name" });
  }

  registerPlayerName(trimmedName, String(playerId));

  // Check if player already in room
  let existingPlayer = room.players.find((p) => p.id === playerId);
  if (!existingPlayer) {
    existingPlayer = {
      id: playerId,
      name: trimmedName,
      isHost: false,
      score: 0,
      currentQuestionIndex: 0,
      finished: false,
      totalCorrect: 0,
      totalTimeMs: 0,
      avatarSeed: Math.floor(Math.random() * 100),
    };
    room.players.push(existingPlayer);
  } else {
    existingPlayer.name = trimmedName;
  }

  broadcastRoomUpdate(trimmedCode);
  res.json({ room });
});

// Fetch Room Info
app.get("/api/rooms/:code", (req, res) => {
  const room = roomsMap.get(req.params.code);
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  res.json({ room });
});

// Start Game in Room
app.post("/api/rooms/:code/start", (req, res) => {
  const { playerId } = req.body;
  const room = roomsMap.get(req.params.code);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.hostId !== playerId) {
    return res.status(403).json({ error: "Only the host can start the game" });
  }

  if (room.players.length < 2) {
    return res.status(400).json({ error: "At least 2 players are required to start an online match" });
  }

  room.status = "playing";
  // Reset player scores & state for match start
  room.players.forEach((p) => {
    p.score = 0;
    p.currentQuestionIndex = 0;
    p.finished = false;
    p.totalCorrect = 0;
    p.totalTimeMs = 0;
  });

  broadcastRoomUpdate(room.code);
  res.json({ room });
});

// Submit Progress / Answers
app.post("/api/rooms/:code/progress", (req, res) => {
  const { playerId, currentQuestionIndex, score, totalCorrect, totalTimeMs, finished } = req.body;
  const room = roomsMap.get(req.params.code);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    if (typeof score === "number") player.score = score;
    if (typeof currentQuestionIndex === "number") player.currentQuestionIndex = currentQuestionIndex;
    if (typeof totalCorrect === "number") player.totalCorrect = totalCorrect;
    if (typeof totalTimeMs === "number") player.totalTimeMs = totalTimeMs;
    if (typeof finished === "boolean") player.finished = finished;
  }

  // Check if all players in room are finished
  const allFinished = room.players.length > 0 && room.players.every((p) => p.finished);
  if (allFinished) {
    room.status = "finished";
  }

  broadcastRoomUpdate(room.code);
  res.json({ room });
});

// Leave Room
app.post("/api/rooms/:code/leave", (req, res) => {
  const { playerId } = req.body;
  const room = roomsMap.get(req.params.code);

  if (room) {
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      roomsMap.delete(room.code);
      roomSockets.delete(room.code);
    } else {
      if (room.hostId === playerId) {
        // Assign new host
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }
      broadcastRoomUpdate(room.code);
    }
  }

  res.json({ success: true });
});

// WebSocket Upgrade Handling
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  if (url.pathname === "/api/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws, request) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const roomCode = url.searchParams.get("roomCode");

  if (!roomCode || !roomsMap.has(roomCode)) {
    ws.close(1008, "Invalid Room Code");
    return;
  }

  if (!roomSockets.has(roomCode)) {
    roomSockets.set(roomCode, new Set());
  }
  const sockets = roomSockets.get(roomCode)!;
  sockets.add(ws);

  // Send immediate state
  const room = roomsMap.get(roomCode);
  if (room) {
    ws.send(JSON.stringify({ type: "ROOM_UPDATE", room }));
  }

  ws.on("close", () => {
    sockets.delete(ws);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
