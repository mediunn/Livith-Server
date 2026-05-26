export type ExternalApi = 'lastfm' | 'spotify' | 'youtube' | 'kakao' | 'apple';

const HOST_MAP: Record<string, ExternalApi> = {
  'ws.audioscrobbler.com': 'lastfm',
  'api.spotify.com': 'spotify',
  'accounts.spotify.com': 'spotify',
  'www.googleapis.com': 'youtube',
  'kapi.kakao.com': 'kakao',
  'appleid.apple.com': 'apple',
};

export function resolveApi(url?: string): ExternalApi | null {
  if (!url) return null;
  try {
    return HOST_MAP[new URL(url).hostname] ?? null; // 매핑 안되면 skip
  } catch {
    return null;
  }
}

export function statusClass(status?: number): string {
  if (!status) return 'error';
  return `${Math.floor(status / 100)}xx`; // 2xx / 4xx / 5xx
}
