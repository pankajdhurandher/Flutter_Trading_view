import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { candleRouter } from './routes/candleRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', candleRouter);
    // Serve static files from flutter web build directory
    const webBuildPath = path.join(__dirname, '../../../build/web');
    app.use(express.static(webBuildPath));
    // Fallback to index.html for single page application routing
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
            return next();
        }
        res.sendFile(path.join(webBuildPath, 'index.html'), (err) => {
            if (err) {
                res.status(404).send('Frontend is building. Please refresh in a moment.');
            }
        });
    });
    app.use(errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map