import { sleep } from 'k6';
import { getApi } from '../common/http.ts';
import { ScenarioSetupData } from '../common/setup-data.ts';

export function setlistSongsScenario(data?: ScenarioSetupData) {
  const setlistId = data?.setlistId;
  if (!setlistId) {
    console.warn('No valid setlist id found; skipping setlist-songs scenario.');
    sleep(1);
    return;
  }

  getApi(`/setlists/${setlistId}/songs`, {
    tags: { endpoint: 'setlist-songs' },
  });
  sleep(1);
}
