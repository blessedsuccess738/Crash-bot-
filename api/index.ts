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

// User Management API
app.get("/api/admin/users", (req, res) => {
  res.json(dbManager.getUsers());
});

app.post("/api/admin/users", (req, res) => {
  const { email } = req.body;
  const result = dbManager.addUser(email);
  res.json(result);
});

app.put("/api/admin/users/:id/role", (req, res) => {
  const { isAdmin } = req.body;
  dbManager.toggleAdmin(req.params.id, isAdmin);
  res.json({ success: true });
});

app.delete("/api/admin/users/:id", (req, res) => {
  dbManager.deleteUser(req.params.id);
  res.json({ success: true });
});

app.post("/api/admin/users/:id/key", (req, res) => {
  const { days } = req.body;
  const result = dbManager.generateAccessKey(req.params.id, days);
  res.json(result);
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

// Remote Browser API
app.get("/api/dev/remote-browser/screenshot", async (req, res) => {
  const base64 = await scraperManager.getScreenshot();
  res.json({ image: base64 });
});

app.post("/api/dev/remote-browser/click", async (req, res) => {
  const { x, y } = req.body;
  await scraperManager.sendClick(x, y);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/type", async (req, res) => {
  const { text } = req.body;
  await scraperManager.sendType(text);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/key", async (req, res) => {
  const { key } = req.body;
  await scraperManager.sendKey(key);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/scroll", async (req, res) => {
  const { deltaY } = req.body;
  await scraperManager.sendScroll(deltaY);
  res.json({ success: true });
});

app.get("/api/dev/remote-browser/tabs", (req, res) => {
  res.json({ tabs: scraperManager.getTabs() });
});

app.post("/api/dev/remote-browser/tabs", async (req, res) => {
  const { url } = req.body;
  await scraperManager.createTab(url);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/tabs/:id/switch", async (req, res) => {
  await scraperManager.switchTab(req.params.id);
  res.json({ success: true });
});

app.delete("/api/dev/remote-browser/tabs/:id", async (req, res) => {
  await scraperManager.closeTab(req.params.id);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/back", async (req, res) => {
  await scraperManager.goBack();
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/forward", async (req, res) => {
  await scraperManager.goForward();
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/reload", async (req, res) => {
  await scraperManager.reload();
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/start", async (req, res) => {
  const { url, force } = req.body;
  if (url) {
    scraperManager.updateConfig({ targetWebUrl: url });
  }
  await scraperManager.startRemoteBrowser(force);
  res.json({ success: true });
});

app.post("/api/dev/remote-browser/go-to-crash", async (req, res) => {
  await scraperManager.goToCrash();
  res.json({ success: true });
});

app.get("/api/dev/remote-browser/logs", (req, res) => {
  res.json({ logs: scraperManager.getBrowserLogs() });
});

app.post("/api/dev/remote-browser/inspect", async (req, res) => {
  const { x, y } = req.body;
  const element = await scraperManager.inspectElement(x, y);
  res.json({ element });
});

app.get("/api/dev/remote-browser/network", (req, res) => {
  res.json({ logs: scraperManager.getNetworkLogs() });
});

app.post("/api/dev/remote-browser/eval", async (req, res) => {
  const result = await scraperManager.evaluateScript(req.body.code);
  res.json(result);
});

export default app;
