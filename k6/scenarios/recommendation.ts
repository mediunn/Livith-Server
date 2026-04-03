import { getApi } from '../common/http.ts';
import { sleep } from 'k6';

export const options = {
  vus: 5,
  iterations: 50,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function recommendationConcertsScenario(){
  getApi('/recommendation/concerts', {
    tags: {endpoint: 'recommend-concerts'},
    headers: {
      Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
    },
  });
  sleep(1);
}

export default function () {
  recommendationConcertsScenario();
}
