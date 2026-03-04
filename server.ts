import express from "express";
import { createServer as createViteServer } from "vite";
import { engine } from "./server/predictor-engine/engine.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
    // app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
