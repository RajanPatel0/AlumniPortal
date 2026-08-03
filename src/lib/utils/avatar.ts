export function getInitials(name?: string | null): string {
  if (!name) return 'A';
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'A';
}
