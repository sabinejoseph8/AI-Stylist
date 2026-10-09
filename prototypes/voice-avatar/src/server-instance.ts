export function serverChanged(previous: string, next: unknown): boolean {
  if (typeof next !== 'string' || !next) throw new Error('Server identity is unavailable.');
  return Boolean(previous && previous !== next);
}
