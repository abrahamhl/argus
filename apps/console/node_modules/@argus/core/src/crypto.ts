import { createHash } from 'node:crypto';

export function hashValue(value: any): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(str).digest('hex');
}
