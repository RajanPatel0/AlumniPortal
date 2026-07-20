export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export const API_BASE = `${BASE_PATH}/api`;

export function apiFetch(endpoint: string, options?: RequestInit) {
  return fetch(`${API_BASE}${endpoint}`, options);
}
