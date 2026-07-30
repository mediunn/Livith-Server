# k6 performance scripts

## Quick start

```bash
npm run perf:smoke:local
npm run perf:dev:local
npm run perf:load:local
```

## Development server test

개발서버에서 반복적으로 실행하는 가벼운 부하 테스트입니다. 운영 전체 부하 테스트가 아니라 핵심 읽기 API의 응답 시간, 에러율, DB slow query를 확인하는 용도입니다.

```bash
BASE_URL=https://staging-api.livith.site K6_ENV=develop TEST_ID=2026-07-30-dev-1 npm run perf:dev
```

인증이 필요한 추천/알림 API까지 포함하려면 `ACCESS_TOKEN`을 함께 전달합니다.

```bash
BASE_URL=https://staging-api.livith.site K6_ENV=develop TEST_ID=2026-07-30-dev-1 ACCESS_TOKEN=<jwt> npm run perf:dev
```

특정 공연/셋리스트를 고정해서 테스트하려면 `CONCERT_ID`, `SETLIST_ID`를 사용할 수 있습니다.

```bash
BASE_URL=https://staging-api.livith.site K6_ENV=develop TEST_ID=2026-07-30-dev-1 CONCERT_ID=1 SETLIST_ID=1 npm run perf:dev
```

로컬 서버 대상 실행:

```bash
npm run perf:dev:local
```

### What to check

Grafana에서는 아래 지표를 우선 확인합니다.

- 요청량: `http_request_total`
- 응답 시간: `http_request_duration_seconds`
- 에러율: `http_request_total`의 `status_code`
- 동시 처리 요청 수: `http_requests_in_flight`
- DB slow query: `db_slow_query_total`

## Environment variables

- `BASE_URL` (default: `http://localhost:3000`)
- `API_PREFIX` (default: `/api/v5`)
- `K6_ENV` (default: `develop`)
- `TEST_ID` (default: `dev-manual`)
- `CONCERT_ID` (optional, used to pin concert scenarios)
- `SETLIST_ID` (optional, used to pin setlist scenarios)
- `ACCESS_TOKEN` (optional, required for auth scenarios)

Examples:

```bash
BASE_URL=https://staging-api.example.com npm run perf:smoke
BASE_URL=https://staging-api.example.com API_PREFIX=/api/v5 npm run perf:load
BASE_URL=https://staging-api.example.com ACCESS_TOKEN=<jwt> npm run perf:load
```

If `ACCESS_TOKEN` is not provided, auth-required scenarios are skipped automatically.

## Script layout

- `common/`: shared config and HTTP helpers
- `scenarios/`: domain-level scenario functions
- `smoke.ts`: fast health/perf check before PR/release
- `dev.ts`: lightweight development-server load test for core read APIs
- `load.ts`: sustained load test for latency and error-rate tracking
