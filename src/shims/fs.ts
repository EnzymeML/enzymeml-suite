const err = (msg = 'fs not available in browser') => console.error(msg);
export default new Proxy({}, { get() { err(); return () => undefined; } });
export const promises = new Proxy({}, { get() { err('fs.promises not available'); return async () => undefined; } });
export function createReadStream() { err('createReadStream not available'); return {}; }