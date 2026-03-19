export function formatRelativeTime(timestamp: number) {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `${days} d`;
}
