import { sleep } from 'k6';
import { getApi } from '../common/http.ts';

type ResponseWithData<T> = {
  data?: T;
};

type ConcertListData = {
  data?: Array<{ id: number }>;
};

function parseJsonBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

function getFirstConcertId(): number | null {
  const response = getApi('/concerts?size=1', {
    tags: { endpoint: 'concerts-list-id-probe' },
  });

  const parsed = parseJsonBody<ResponseWithData<ConcertListData>>(
    response.body,
  );
  return parsed?.data?.data?.[0]?.id ?? null;
}

export function resolveConcertId(): number | null {
  const envConcertId = Number(__ENV.CONCERT_ID);
  if (Number.isInteger(envConcertId) && envConcertId > 0) {
    return envConcertId;
  }

  return getFirstConcertId();
}

export function concertsListScenario() {
  getApi('/concerts?size=20', {
    tags: { endpoint: 'concerts-list' },
  });
  sleep(1);
}

export function concertDetailsScenario() {
  const concertId = resolveConcertId();
  if (!concertId) {
    console.warn(
      'No valid concert id found; skipping concert-details scenario.',
    );
    sleep(1);
    return;
  }

  getApi(`/concerts/${concertId}`, {
    tags: { endpoint: 'concert-details' },
  });
  sleep(1);
}

export function concertSetlistsScenario() {
  const concertId = resolveConcertId();
  if (!concertId) {
    console.warn(
      'No valid concert id found; skipping concert-setlists scenario.',
    );
    sleep(1);
    return;
  }

  getApi(`/concerts/${concertId}/setlists`, {
    tags: { endpoint: 'concert-setlists' },
  });
  sleep(1);
}

export function concertCommentsScenario() {
  const concertId = resolveConcertId();
  if (!concertId) {
    console.warn(
      'No valid concert id found; skipping concert-comments scenario.',
    );
    sleep(1);
    return;
  }

  getApi(`/concerts/${concertId}/comments?size=20`, {
    tags: { endpoint: 'concert-comments' },
  });
  sleep(1);
}
