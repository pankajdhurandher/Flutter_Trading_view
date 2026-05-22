export function errorHandler(err, _req, res, _next) {
    // eslint-disable-next-line no-console
    console.error('Backend error:', err);
    if (err instanceof RangeError) {
        return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
}
//# sourceMappingURL=errorHandler.js.map