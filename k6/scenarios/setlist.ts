import { sleep } from 'k6';
import { getApi } from '../common/http.ts';
import { resolveConcertId } from './concert.ts';

type ResponseWithData<T> = {
  data?: T;
};

type SetlistData = Array<{ id: number }>;

function parseJsonBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

function resolveSetlistId(): number | null {
  const envSetlistId = Number(__ENV.SETLIST_ID);
  if (Number.isInteger(envSetlistId) && envSetlistId > 0) {
    return envSetlistId;
  }

  const concertId = resolveConcertId();
  if (!concertId) {
    return null;
  }

  const response = getApi(`/concerts/${concertId}/setlists`, {
    tags: { endpoint: 'setlists-id-probe' },
  });

  const parsed = parseJsonBody<ResponseWithData<SetlistData>>(response.body);
  return parsed?.data?.[0]?.id ?? null;
}

export function setlistSongsScenario() {
  const setlistId = resolveSetlistId();
  if (!setlistId) {
    console.warn('No valid setlist id found; skipping setlist-songs scenario.');
    sleep(1);
    return;
  }

  getApi(`/setlists/${setlistId}/songs`, {
    tags: { endpoint: 'setlist-songs' },
  });
  sleep(1);
}
