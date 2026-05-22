import { isValidInterval } from '../utils/timeUtils.js';
export function validateCandleQuery(req, res, next) {
    const symbol = req.query.symbol;
    const interval = req.query.interval;
    const limit = req.query.limit;
    if (typeof symbol !== 'string' || !symbol.trim()) {
        return res.status(400).json({ error: 'symbol is required and must be a non-empty string' });
    }
    if (typeof interval !== 'string' || !isValidInterval(interval)) {
        return res.status(400).json({ error: 'interval is required and must be either 1m or 5m' });
    }
    if (limit !== undefined) {
        const parsedLimit = Number(limit);
        if (Number.isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
            return res.status(400).json({ error: 'limit must be a positive integer between 1 and 500' });
        }
        if (!Number.isInteger(parsedLimit)) {
            return res.status(400).json({ error: 'limit must be an integer' });
        }
    }
    return next();
}
//# sourceMappingURL=validateQuery.js.map