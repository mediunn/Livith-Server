import http, { RefinedResponse } from 'k6/http';
import { check } from 'k6';
import { DEFAULT_HEADERS, apiPath, buildUrl } from './config.ts';

type GetApiOptions = {
  tags?: Record<string, string>;
  headers?: Record<string, string>;
};

export function getApi(
  path: string,
  { tags = {}, headers = {} }: GetApiOptions = {},
): RefinedResponse<'text'> {
  const url = buildUrl(apiPath(path));
  const response = http.get(url, {
    tags,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
  });

  check(response, {
    'status is 200': (res) => res.status === 200,
  });

  return response;
}
