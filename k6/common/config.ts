export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = __ENV.API_PREFIX || '/api/v5';

export const DEFAULT_HEADERS = {
  Accept: 'application/json',
};

export function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

export function apiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalizedPath}`;
}
