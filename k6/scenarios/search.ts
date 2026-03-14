import { sleep } from 'k6';
import { getApi } from '../common/http.ts';

export function searchSectionsScenario() {
  getApi('/search/sections', {
    tags: { endpoint: 'search-sections' },
  });
  sleep(1);
}

export function searchSuggestionsScenario() {
  getApi('/search/suggestions?letter=a', {
    tags: { endpoint: 'search-suggestions' },
  });
  sleep(1);
}
