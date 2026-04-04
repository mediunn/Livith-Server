import { getApi } from './http.ts';

export type ScenarioSetupData = {
  concertId: number | null;
  setlistId: number | null;
};

type ResponseWithData<T> = {
  data?: T;
};

type ConcertListData = {
  data?: Array<{ id: number }>;
};

type SetlistData = Array<{ id: number }>;

function parseJsonBody<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

function parsePositiveEnvInt(key: string): number | null {
  const value = Number(__ENV[key]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getConcertIdFromApi(): number | null {
  const response = getApi('/concerts?size=1', {
    tags: { endpoint: 'setup-concert-id-probe' },
  });

  const parsed = parseJsonBody<ResponseWithData<ConcertListData>>(
    response.body,
  );

  return parsed?.data?.data?.[0]?.id ?? null;
}

function getSetlistIdFromApi(concertId: number): number | null {
  const response = getApi(`/concerts/${concertId}/setlists`, {
    tags: { endpoint: 'setup-setlist-id-probe' },
  });

  const parsed = parseJsonBody<ResponseWithData<SetlistData>>(response.body);
  return parsed?.data?.[0]?.id ?? null;
}

export function setupScenarioData(): ScenarioSetupData {
  const concertId = parsePositiveEnvInt('CONCERT_ID') ?? getConcertIdFromApi();

  const setlistId =
    parsePositiveEnvInt('SETLIST_ID') ??
    (concertId ? getSetlistIdFromApi(concertId) : null);

  return {
    concertId,
    setlistId,
  };
}
