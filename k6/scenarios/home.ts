import { sleep } from 'k6';
import { getApi } from '../common/http.ts';

export function homeSectionsScenario() {
  getApi('/home/sections', {
    tags: { endpoint: 'home-sections' },
  });
  sleep(1);
}
