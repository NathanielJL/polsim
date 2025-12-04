/**
 * POLSIM - MAIN BACKEND SERVER
 * 
 * Express + Socket.io server for real-time multiplayer political simulator
 * Handles player connections, turn management, and WebSocket broadcasts
 */

import express, { Express, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import { models } from "./models/mongoose";
import authRoutes from "./routes/auth";
import playerRoutes from "./routes/players";
import sessionRoutes from "./routes/sessions";
import dashboardRoutes from "./routes/dashboard";
import mapRoutes from "./routes/map";
import gmRoutes from "./routes/gm";
import electionRoutes from "./routes/elections";
import businessRoutes from "./routes/business";
import legalRoutes from "./routes/legal";
import { TurnScheduler } from "./services/TurnScheduler";

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
connectDB();

// Initialize turn scheduler on startup
const turnScheduler = new TurnScheduler();

// Types
interface GameSession {
  id: string;
  players: Map<string, any>;
  currentTurn: number;
  maintenanceActive: boolean;
  nextMaintenanceTime: Date;
}

// Game state
const gameSessions: Map<string, GameSession> = new Map();
const TURN_DURATION = 86400000; // 24 hours in milliseconds
const MAINTENANCE_DURATION = 3600000; // 1 hour for maintenance

// ===== WebSocket Events =====

io.on("connection", (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Player joins a session
  socket.on("joinGame", (data: { playerId: string; sessionId: string }) => {
    const { playerId, sessionId } = data;
    socket.join(`session-${sessionId}`);
    socket.emit("gameJoined", {
      playerId,
      sessionId,
      message: "Successfully joined game session",
    });
  });

  // Player submits an action
  socket.on("submitAction", (data: any) => {
    const { playerId, sessionId, action } = data;
    // Validate and queue action
    console.log(`Action from ${playerId}:`, action);
    socket.emit("actionAck", { status: "received", actionId: action.id });
  });

  // Stream real-time updates
  socket.on("subscribeToUpdates", (data: { sessionId: string; topics: string[] }) => {
    const { sessionId, topics } = data;
    topics.forEach((topic) => {
      socket.join(`${sessionId}-${topic}`);
    });
    socket.emit("subscriptionConfirmed", { topics });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// ===== REST API ENDPOINTS =====

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Authentication routes
app.use("/auth", authRoutes);

// Player routes
app.use("/api/players", playerRoutes);

// Session routes (game initialization and world data)
app.use("/api/sessions", sessionRoutes);

// Dashboard and trading routes
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/trading", dashboardRoutes);

// Map import and data routes
app.use("/api/map", mapRoutes);

// GM dashboard routes
app.use("/api/gm", gmRoutes);

// Elections and voting routes
app.use("/api/elections", electionRoutes);

// Business and companies routes
app.use("/api/business", businessRoutes);

// Legal services routes
app.use("/api/legal", legalRoutes);

// Create or join game session
app.post("/api/sessions", (req: Request, res: Response) => {
  const { playerId, sessionName } = req.body;

  let sessionId = req.body.sessionId;
  if (!sessionId) {
    sessionId = `session-${Date.now()}`;
    gameSessions.set(sessionId, {
      id: sessionId,
      players: new Map(),
      currentTurn: 1,
      maintenanceActive: false,
      nextMaintenanceTime: new Date(Date.now() + TURN_DURATION),
    });
  }

  const session = gameSessions.get(sessionId);
  if (session) {
    session.players.set(playerId, {
      playerId,
      joinedAt: new Date(),
      lastActive: new Date(),
    });

    res.json({
      sessionId,
      currentTurn: session.currentTurn,
      maintenanceActive: session.maintenanceActive,
      nextMaintenanceTime: session.nextMaintenanceTime,
    });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// Get session state
app.get("/api/sessions/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = gameSessions.get(sessionId);

  if (session) {
    res.json({
      id: session.id,
      currentTurn: session.currentTurn,
      playerCount: session.players.size,
      maintenanceActive: session.maintenanceActive,
      nextMaintenanceTime: session.nextMaintenanceTime,
    });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// Get player map/home data
app.get("/api/players/:playerId/home", (req: Request, res: Response) => {
  const { playerId } = req.params;

  // TODO: Query from database
  res.json({
    playerId,
    username: "Player1",
    location: "Capital City",
    cash: 100000,
    reputation: 0,
    reputationByGroup: {},
    actionsRemaining: 5,
    currentTurn: 1,
    profile: {
      ideology: { economic: 0, social: 0, personal: 0 },
      role: null,
    },
  });
});

// Get markets
app.get("/api/markets/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // TODO: Query from database
  res.json({
    markets: [
      {
        id: "market-healthcare",
        name: "Healthcare",
        currentPrice: 100,
        trend: "stable",
        affectedByPolicies: [],
      },
      {
        id: "market-housing",
        name: "Housing",
        currentPrice: 120,
        trend: "rising",
        affectedByPolicies: [],
      },
    ],
  });
});

// Get news
app.get("/api/news/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // TODO: Query from database, return recent articles
  res.json({
    articles: [],
    outlets: [],
  });
});

// Submit article
app.post("/api/articles/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { playerId, title, content, outletId } = req.body;

  // TODO: Validate outlet alignment, deduct action points/cost
  res.json({
    success: true,
    articleId: `article-${Date.now()}`,
    message: "Article submitted for review",
  });
});

// Get reputation breakdown
app.get("/api/players/:playerId/reputation", (req: Request, res: Response) => {
  const { playerId } = req.params;

  // TODO: Query from database
  res.json({
    overallReputation: 0,
    byGroup: {
      "Centrist-MiddleClass": 0,
      "LeftModerate-LowerClass": 0,
      "RightModerate-UpperClass": 5,
    },
  });
});

// Game Master endpoints
app.get("/api/gm/pending-events/:gmId", (req: Request, res: Response) => {
  const { gmId } = req.params;

  // TODO: Get pending events for review
  res.json({
    events: [],
  });
});

app.post("/api/gm/events/:eventId/review", (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { gmId, approved, durationOverride } = req.body;

  // TODO: Process GM review
  res.json({
    success: true,
    eventId,
    status: approved ? "approved" : "rejected",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`POLSIM Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  // Initialize turn schedulers for all active sessions
  try {
    await turnScheduler.initializeAllSessions();
  } catch (error) {
    console.error('Failed to initialize turn schedulers:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  turnScheduler.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io, app };
