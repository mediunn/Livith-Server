import { getApi } from '../common/http.ts';
import { sleep } from 'k6';


export function notificationListScenario(){
  getApi('/notifications?size=20', {
    tags: {endpoint: 'notification-list'},
    headers: {
      Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
    },
  });
  sleep(1);
}

export function notificationUnreadCountScenario(){
  getApi('/notifications/unread-count', {
    tags: {endpoint: 'notification-unread-count'},
    headers: {
      Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
    },
  });
  sleep(1);
}