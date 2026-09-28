import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3001;
// Keep the standalone server compatible with the existing Replit, Render,
// and Railway workflows. Vercel imports the API-only app from app.ts instead.
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('/{*path}', (_req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log(`Serving frontend from ${frontendDist}`);
}
app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map