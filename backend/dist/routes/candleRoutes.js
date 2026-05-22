import { Router } from 'express';
import { validateCandleQuery } from '../middleware/validateQuery.js';
export const candleRouter = Router();
let controller = null;
candleRouter.get('/candles', validateCandleQuery, async (req, res, next) => {
    if (!controller) {
        return res.status(500).json({ error: 'Candle controller not initialized' });
    }
    return controller.getHistoricalCandles(req, res, next);
});
export function setCandleController(value) {
    controller = value;
}
//# sourceMappingURL=candleRoutes.js.map