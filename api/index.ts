import express from "express";
import { engine } from "../server/predictor-engine/engine.js";
import { scraperManager } from "../server/scraper/manager.js";
import { dbManager } from "../server/db/index.js";

const app = express();

app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/predict", (req, res) => {
  const { history } = req.body;
  if (!engine.isRunning) engine.start();
  const prediction = engine.predictNext(history || []);
  res.json({ prediction });
});

// SSE Endpoint for Real-Time Sync
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  // Add client to global list
  const clientId = Date.now();
  global.sseClients = global.sseClients || new Map();
  global.sseClients.set(clientId, res);

  req.on("close", () => {
    global.sseClients.delete(clientId);
  });
});

// Helper to broadcast to all SSE clients
export const broadcastSSE = (data) => {
  if (!global.sseClients) return;
  const message = `data: ${JSON.stringify(data)}\n\n`;
  global.sseClients.forEach((client) => client.write(message));
};

// Database API
app.get("/api/crashes", (req, res) => {
  res.json(dbManager.getRecentCrashes(50));
});

// Devtools API
app.get("/api/dev/engine-status", (req, res) => {
  res.json(engine.getStatus());
});

app.post("/api/dev/engine-toggle", (req, res) => {
  if (engine.isRunning) {
    engine.stop();
  } else {
    engine.start();
  }
  res.json(engine.getStatus());
});

// Scraper / Network API
app.get("/api/dev/network-config", (req, res) => {
  res.json(scraperManager.getConfig());
});

app.post("/api/dev/network-config", (req, res) => {
  const updated = scraperManager.updateConfig(req.body);
  res.json(updated);
});

app.post("/api/dev/scraper-toggle", async (req, res) => {
  const config = scraperManager.getConfig();
  if (config.isRunning) {
    await scraperManager.stop();
  } else {
    await scraperManager.start();
  }
  res.json(scraperManager.getConfig());
});

export default app;
