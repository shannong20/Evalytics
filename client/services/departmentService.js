// Client-side Department Service
// Returns array of { department_id: string, name: string }

const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_SERVER_URL) || 'http://localhost:5000';

export async function listDepartments() {
  const url = `${API_BASE}/api/v1/departments`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch departments (${res.status}): ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  if (data && data.status === 'success' && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}
