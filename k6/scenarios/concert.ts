import { sleep } from 'k6';
import { getApi } from '../common/http.ts';
import { ScenarioSetupData } from '../common/setup-data.ts';

export function concertsListScenario() {
  getApi('/concerts?size=20', {
    tags: { endpoint: 'concerts-list' },
  });
  sleep(1);
}

export function concertDetailsScenario(data?: ScenarioSetupData) {
  const concertId = data?.concertId;
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

export function concertSetlistsScenario(data?: ScenarioSetupData) {
  const concertId = data?.concertId;
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

export function concertCommentsScenario(data?: ScenarioSetupData) {
  const concertId = data?.concertId;
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
