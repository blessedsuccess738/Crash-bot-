import express from "express";
import { engine } from "../server/predictor-engine/engine.js";
import { scraperManager } from "../server/scraper/manager.js";

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
