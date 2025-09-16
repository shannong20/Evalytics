// Centralized API URL helpers for the frontend
// Ensures we use the correct backend base URL and avoid port mismatches in dev

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any)?.env?.VITE_SERVER_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default dev server port for our Express backend is 3000 (see server/server.js)
  return 'http://localhost:5000';
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!path.startsWith('/')) return `${base}/${path}`;
  return `${base}${path}`;
}
