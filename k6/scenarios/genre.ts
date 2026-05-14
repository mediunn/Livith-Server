import { sleep } from 'k6';
import { getApi } from '../common/http.ts';

export function genresScenario() {
  getApi('/genres', {
    tags: { endpoint: 'genres-list' },
  });
  sleep(1);
}
