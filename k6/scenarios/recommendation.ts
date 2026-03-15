import { getApi } from '../common/http.ts';
import { sleep } from 'k6';


export function recommendationConcertsScenario(){
  getApi('/recommendation/concerts', {
    tags: {endpoint: 'recommend-concerts'},
    headers: {
      Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
    },
  });
  sleep(1);
}
