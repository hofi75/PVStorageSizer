import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { analyzeRouter } from './routes/analyze.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api', analyzeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// In the Docker image, the client's built assets are placed alongside dist/ at
// server/public. In local dev there's no such folder (Vite serves the client
// instead), so this is a no-op unless the image actually shipped that build.
const clientDistPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Battery calculator API listening on http://localhost:${port}`);
});
