import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { CandleGeneratorService } from './services/candleGeneratorService.js';
import { CandleRepository } from './repositories/candleRepository.js';
import { CandleHistoryService } from './services/candleHistoryService.js';
import { RealtimeCandleService } from './services/realtimeCandleService.js';
import { RealtimeWebSocketServer } from './websocket/realtimeWebSocketServer.js';
import { createCandleController } from './controllers/candleController.js';
import { setCandleController } from './routes/candleRoutes.js';
dotenv.config();
const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();
const server = http.createServer(app);
const generator = new CandleGeneratorService();
const repository = new CandleRepository(generator);
const historyService = new CandleHistoryService(repository);
const realtimeService = new RealtimeCandleService(generator);
const websocketServer = new RealtimeWebSocketServer(server, realtimeService);
const candleController = createCandleController(historyService);
setCandleController(candleController);
websocketServer.start();
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Realtime stock backend listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map