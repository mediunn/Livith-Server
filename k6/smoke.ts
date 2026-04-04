import {
  concertCommentsScenario,
  concertDetailsScenario,
  concertSetlistsScenario,
  concertsListScenario,
} from './scenarios/concert.ts';
import { genresScenario } from './scenarios/genre.ts';
import { homeSectionsScenario } from './scenarios/home.ts';
import {
  searchArtistsScenario,
  searchConcertsScenario,
  searchSectionsScenario,
  searchSuggestionsScenario,
} from './scenarios/search.ts';
import { recommendationConcertsScenario } from './scenarios/recommendation.ts';
import {
  notificationListScenario,
  notificationUnreadCountScenario,
} from './scenarios/notification.ts';
import { setlistSongsScenario } from './scenarios/setlist.ts';

const hasAccessToken = Boolean(__ENV.ACCESS_TOKEN);

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
    concert_details: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'concertDetails',
    },
    concert_setlists: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'concertSetlists',
    },
    concert_comments: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'concertComments',
    },
    search_concerts: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'searchConcerts',
    },
    search_artists: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'searchArtists',
    },
    setlist_songs: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'setlistSongs',
    },
    genres: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      exec: 'genres',
    },
    ...(hasAccessToken
      ? {
          recommend_concerts: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 1,
            exec: 'recommendConcerts',
          },
          notification_list: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 1,
            exec: 'notificationList',
          },
          notification_unread: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 1,
            exec: 'notificationUnread',
          },
        }
      : {}),
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

export function concertDetails() {
  concertDetailsScenario();
}

export function concertSetlists() {
  concertSetlistsScenario();
}

export function concertComments() {
  concertCommentsScenario();
}

export function searchConcerts() {
  searchConcertsScenario();
}

export function searchArtists() {
  searchArtistsScenario();
}

export function setlistSongs() {
  setlistSongsScenario();
}

export function genres() {
  genresScenario();
}

export function recommendConcerts() {
  recommendationConcertsScenario();
}

export function notificationList() {
  notificationListScenario();
}

export function notificationUnread() {
  notificationUnreadCountScenario();
}
