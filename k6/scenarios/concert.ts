import { sleep } from 'k6';
import { getApi } from '../common/http.ts';

export function concertsListScenario() {
  getApi('/concerts?size=20', {
    tags: { endpoint: 'concerts-list' },
  });
  sleep(1);
}
