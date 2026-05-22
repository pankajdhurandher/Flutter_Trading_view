export function normalizeTimestampToMinute(timestamp) {
    return Math.floor(timestamp / 60000) * 60000;
}
export function normalizeTimestampTo5Minute(timestamp) {
    return Math.floor(timestamp / 300000) * 300000;
}
export function isValidInterval(value) {
    return value === '1m' || value === '5m';
}
//# sourceMappingURL=timeUtils.js.map