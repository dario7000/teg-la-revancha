const express = require('express');
const path = require('path');
const fs = require('fs');

// --- Crash handlers so the process never dies silently ---
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// --- Startup checks ---
console.log(`[startup] Serving static files from: ${distPath}`);
console.log(`[startup] dist/ exists: ${fs.existsSync(distPath)}`);
console.log(`[startup] dist/index.html exists: ${fs.existsSync(indexPath)}`);

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log(`[startup] dist/ contents (${files.length} items): ${files.join(', ')}`);
}

// --- Serve static files from dist ---
app.use(express.static(distPath));

// --- Health check endpoint (BEFORE the catch-all) ---
app.get('/health', (_req, res) => {
  const healthy = fs.existsSync(indexPath);
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'missing index.html',
    distExists: fs.existsSync(distPath),
    indexExists: healthy,
    distPath,
  });
});

// --- SPA fallback - all routes serve index.html ---
app.get('*', (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send(
      'index.html not found. The build may have failed or the dist/ directory is missing. ' +
      `Looked in: ${indexPath}`
    );
  }

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[error] sendFile failed for ${req.url}:`, err);
      if (!res.headersSent) {
        res.status(500).send('Failed to serve index.html: ' + err.message);
      }
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Client running on port ${PORT}`);
});
