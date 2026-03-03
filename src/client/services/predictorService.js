import { engine } from '../../bot-engine/core/engine';

// Bridge between UI and Bot Engine
export const getPrediction = (history) => {
  if (!engine.isRunning) engine.start();
  return engine.predictNext(history);
};
