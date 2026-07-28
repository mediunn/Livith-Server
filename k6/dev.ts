import { ScenarioSetupData, setupScenarioData } from './common/setup-data.ts';
import { homeSectionsScenario } from './scenarios/home.ts';
import { searchArtistsScenario, searchConcertsScenario, searchSectionsScenario, searchSuggestionsScenario } from './scenarios/search.ts';
import { concertDetailsScenario, concertSetlistsScenario, concertsListScenario } from './scenarios/concert.ts';
import { setlistSongsScenario } from './scenarios/setlist.ts';
import { genresScenario } from './scenarios/genre.ts';
import { recommendationConcertsScenario } from './scenarios/recommendation.ts';
import { notificationListScenario, notificationUnreadCountScenario } from './scenarios/notification.ts';


const hasAccessToken = Boolean(__ENV.ACCESS_TOKEN);

function devStages(target: number){
  return [
    { duration: '30s', target},
    { duration: '3m', target },
    { duration: '30s', target: 0},
  ];
}

export const options = {
  tags: {
    env: __ENV.K6_ENV || 'develop',
    testid: __ENV.TEST_ID || 'dev-manual',
  },
  scenarios: {
    home_sections: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: devStages(2),
      exec: 'homeSections',
    },
    search_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: devStages(3),
      exec: 'searchRead',
    },
    concert_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: devStages(3),
      exec: 'concertRead',
    },
    genres: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: devStages(1),
      exec: 'genres',
    },
    ...(hasAccessToken
      ? {
        auth_read: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: devStages(1),
          exec: 'authRead',
        },
      }
      : {}),
  },
  thresholds: {
    checks: ['rate>0.95'],
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
  },
};

export function setup(): ScenarioSetupData {
  return setupScenarioData();
}

export function homeSections() {
  homeSectionsScenario();
}

export function searchRead(){
  searchSectionsScenario();
  searchSuggestionsScenario();
  searchConcertsScenario();
  searchArtistsScenario();
}

export function concertRead(data: ScenarioSetupData) {
  concertsListScenario();
  concertDetailsScenario(data);
  concertSetlistsScenario(data);
  setlistSongsScenario(data);
}

export function genres() {
  genresScenario();
}

export function authRead() {
  recommendationConcertsScenario();
  notificationListScenario();
  notificationUnreadCountScenario();
}