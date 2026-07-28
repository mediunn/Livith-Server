# k6 performance scripts

## Quick start

```bash
npm run perf:smoke:local
npm run perf:load:local
```

## Environment variables

- `BASE_URL` (default: `http://localhost:3000`)
- `API_PREFIX` (default: `/api/v5`)
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
- `load.ts`: sustained load test for latency and error-rate tracking
