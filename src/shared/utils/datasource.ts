export function formatDatasource(raw: string): string {
  const colonIdx = raw.indexOf(":");
  const s = colonIdx === -1 ? raw : raw.slice(colonIdx + 1);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
