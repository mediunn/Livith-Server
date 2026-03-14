import { concertsListScenario } from './scenarios/concert.ts';
import { genresScenario } from './scenarios/genre.ts';
import { homeSectionsScenario } from './scenarios/home.ts';
import {
  searchSectionsScenario,
  searchSuggestionsScenario,
} from './scenarios/search.ts';

export const options = {
  scenarios: {
    home_sections: {
      executor: 'per-vu-iterations', //각 시나리오를 1명의 가상 사용자가 1회씩 실행하도록 설정
      vus: 1,
      iterations: 1,
      exec: 'homeSections',
    },
    search_sections: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'searchSections',
    },
    search_suggestions: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'searchSuggestions',
    },
    concerts_list: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'concertsList',
    },
    genres: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'genres',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function homeSections() {
  homeSectionsScenario();
}

export function searchSections() {
  searchSectionsScenario();
}

export function searchSuggestions() {
  searchSuggestionsScenario();
}

export function concertsList() {
  concertsListScenario();
}

export function genres() {
  genresScenario();
}
