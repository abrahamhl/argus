import { createHash } from 'node:crypto';
export function hashValue(value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return createHash('sha256').update(str).digest('hex');
}
//# sourceMappingURL=crypto.js.map