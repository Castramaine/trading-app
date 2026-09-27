const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (apiBase ? `${apiBase}${path}` : path);
