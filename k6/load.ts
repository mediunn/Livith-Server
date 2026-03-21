import { concertsListScenario } from './scenarios/concert.ts';
import { genresScenario } from './scenarios/genre.ts';
import { homeSectionsScenario } from './scenarios/home.ts';
import {
  searchSectionsScenario,
  searchSuggestionsScenario,
} from './scenarios/search.ts';
import { recommendationConcertsScnario } from './scenarios/recommendation.ts';
import { notificationListScenario, notificationUnreadCountScenario } from './scenarios/notification.ts';

export const options = {
  scenarios: {
    home_sections: {
      executor: 'ramping-vus',
      startVUs: 1,
      // 30초 동안 1명에서 10명으로 증가, 2분 동안 10명에서 30명으로 증가, 마지막으로 30초 동안 30명에서 0명으로 감소하도록 설정
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      exec: 'homeSections',
    },
    search_sections: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'searchSections',
    },
    search_suggestions: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'searchSuggestions',
    },
    concerts_list: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      exec: 'concertsList',
    },
    genres: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'genres',
    },
    recommend_concerts: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      exec: 'recommendConcerts',
    },
    notification_list: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'notificationList',
    },
    notification_unread: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'notificationUnread',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
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

export function recommendConcerts() {
  recommendationConcertsScnario();
}

export function notificationList() {
  notificationListScenario();
}

export function notificationUnread() {
  notificationUnreadCountScenario();
}
