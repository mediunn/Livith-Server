# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Livith-Server is a NestJS (v11) + TypeScript backend API for a concert/music event application. It uses Prisma (v6) with MySQL (AWS RDS), Firebase Admin SDK for push notifications, and Passport.js for OAuth (Kakao, Apple) + JWT authentication.

## Commands

```bash
npm run start:dev          # Dev server with watch mode (port 3000)
npm run build              # Compile TypeScript to dist/
npm run start:prod         # Production mode (node dist/src/main)
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
npm test                   # Run all unit tests (Jest)
npm run test:watch         # Tests in watch mode
npm run test:cov           # Tests with coverage report
npm run test:e2e           # E2E tests
npx prisma migrate dev     # Local dev: create + apply migrations
npx prisma migrate deploy  # Prod/CI: apply pending migrations only
npx prisma generate        # Regenerate Prisma client after schema changes
npm run perf:smoke         # k6 smoke test (k6/smoke.ts)
npm run perf:load          # k6 load test (k6/load.ts)
```

Run a single test file: `npx jest --config package.json <path-to-spec>`

Swagger docs available at `http://localhost:3000/api-docs` when server is running.

## Architecture

### Module Structure

NestJS modular architecture with 17 feature modules registered in `src/app.module.ts`:

- **auth** - OAuth (Kakao/Apple) login + JWT token issuance. Passport strategies in `auth/strategies/`, guards in `auth/guards/`, JWT payload interface in `auth/interface/`.
- **concert** - Core concert CRUD with status tracking (ONGOING, UPCOMING, COMPLETED, CANCELED).
- **notification** - FCM push notifications with scheduled delivery. Sub-structure: `fcm/` (Firebase init), `scheduler/` (cron jobs for queue processing, ticketing reminders, cleanup, interest concerts, recommendations), `service/`, `strategies/` (per-NotificationType `notification-strategy.service.ts` dispatcher), `dto/request|response`, `enums/`, `constants/`, `test/`.
- **recommendation** - Genre/artist-based recommendations. Integrates with LastFM/Spotify/YouTube via `integrations/`. Uses `services/music-api-factory.service.ts` pattern. LastFM rate limit 방어를 위해 `utils/`에 3-레이어 구조 구현: `SwrCache` (LRU + Stale-While-Revalidate) → `InFlightCoalescing` → `Bottleneck` (Token Bucket + 지수 백오프 retry).
- **artist** - 아티스트 매칭 서비스 (`service/artist-matching.service.ts`).
- **setlist** - Concert setlists with songs and fanchants.
- **song** - Song details including lyrics, pronunciation, translation.
- **comment** - User comments on concerts with reporting.
- **user** - User management, favorite artists/genres, interest concerts.
- **home** / **search** - Home page sections and search functionality.
- **genre** - Genre catalog management.
- **meilisearch** - 아티스트 검색 인덱스(`artists`). `searchableAttributes: ["artistName", "searchNames"]`, `filterableAttributes: ["genreId"]`. 앱 기동 시 settings 자동 적용, Artist 생성/수정 시 인덱스 동기화.
- **image-proxy** - 외부 이미지를 프록시·캐시해 클라이언트에 전달 (Hot-link 차단/포맷 호환 대응).
- **apple-review** - App Store 리뷰 RSS를 폴링해 신규 리뷰를 Discord 웹훅으로 전송 (`@Cron`).
- **metrics** - Prometheus 메트릭 수집. `HttpMetricsInterceptor`로 전역 등록 (`http_request_total`, `http_request_duration_seconds`, `http_requests_in_flight`). `@InstrumentJob` 데코레이터로 스케줄러 메트릭 수집 (`SchedulerMetricsService`). `ExternalApiMetricsService.attach(axiosInstance)`로 외부 API RED 메트릭(`external_api_request_*`) 수집 — 호스트 allowlist(`external-api.util.ts`)로 게이팅.
- **logger** - Winston + OpenTelemetry 연동. 모든 로그에 `traceId`/`spanId` 자동 주입. `@Global()` 모듈로 등록.

### Cross-Cutting Concerns (`src/common/`)

- **GlobalExceptionFilter** (`filters/`) - Unified error responses using `BusinessException` and `ErrorCode` enum.
- **GlobalResponseInterceptor** (`interceptors/`) - Wraps all responses in `{ message, data, statusCode }` format. Adds ETag caching for GET requests (304 on `If-None-Match` match).
- **BusinessException** (`exceptions/`) - 도메인 예외 베이스. `ErrorCode`와 함께 사용.
- **@CurrentUser decorator** (`decorator/`) - Extracts JWT payload in controllers.
- **Error codes** (`enums/error-code.enum.ts`) - Centralized error code definitions.
- **Pipes** (`pipes/parse-positive-int.pipe.ts`) - 양수 정수 path/query 파싱.
- **Utils** (`utils/`) - `date.util` (dayjs 래퍼, D-day 계산 등), `concert.util`, `artist-name.util`, `batch-processor.util`, `cookie.util`, `sendPostMessagePayload`.
- **API prefix** (`constants/api-prefix.ts`) - Currently `api/v6`.

### Database

- **Schema**: `prisma/schema.prisma` (32 models). Key models: Concert, Artist, Setlist, SetlistSong, Song, User, FcmToken, NotificationSet, ConcertNotificationQueue, Schedule, NotificationHistory, CrawlHistory.
- **PrismaModule** (`prisma/prisma.module.ts`) - Shared module exporting `PrismaService`. Imported by feature modules that need DB access.
- **Migrations**: `prisma/migrations/` (91 migrations). Prod에는 `migrate deploy`만 사용 — 실패 시 P3018로 후속 마이그레이션 차단되므로 raw SQL로 prod 직접 수정 금지.

### Observability

- **OpenTelemetry** - `src/tracing.ts`에서 초기화. Tempo로 분산 트레이스 수집.
- **Loki** - Winston JSON 로그 수집. 로그에 traceId 포함되어 Tempo 트레이스와 연동.
- **Prometheus + Grafana** - HTTP, 외부 API, 스케줄러, FCM, 추천 도메인 메트릭 시각화.
- **k6** - `k6/` 디렉토리 (smoke / load / scenarios / common). `npm run perf:smoke|load` 또는 `:local` variant로 실행.

### Global Middleware (configured in `src/main.ts`)

- `ValidationPipe` with whitelist, transform, forbidNonWhitelisted
- `cookieParser`, `express-session` (24h expiry)
- CORS enabled for localhost:5173, livith.site, staging.livith.site
- 기동 시 `ExternalApiMetricsService.attach(HttpService.axiosRef)`로 외부 API 인터셉터 등록 (Nest `HttpService` 단일 인스턴스 경유)

## Conventions

### Git

- **Branches**: `main` (production v6), `develop` (development/PRs target here), `legacy` (production v4, port 3000 유지용)
- **Branch naming**: `{type}/#{issue-number}-description` (e.g., `feat/#123-user-login-api`)
- **Commit format**: `{emoji} {type}: description`
  - `✨ feat:` / `🐛 fix:` / `📝 docs:` / `♻️ refactor:` / `🎨 style:` / `🔧 chore:` / `🔥 remove:` / `🚀 deploy:`

### Code Patterns

- Each feature module follows Controller → Service → PrismaService pattern.
- 외부 HTTP 호출은 모두 Nest `HttpService` + `firstValueFrom` 경유 (bare `import axios from 'axios'` 금지) — 메트릭 attach 지점이 단일화돼 있음.
- DTOs use `class-validator` decorators for request validation and `@ApiProperty()` for Swagger.
- Dates handled with `dayjs` (see `common/utils/date.util.ts`).
- Notification types are enumerated in Prisma `NotificationType` enum:
  - 관심 콘서트: `INTEREST_CONCERT`
  - 티켓팅: `PRE_TICKETING_OPEN`, `GENERAL_TICKETING_OPEN`, `PRE_TICKETING_1D`, `GENERAL_TICKETING_1D`, `PRE_TICKETING_30MIN`, `GENERAL_TICKETING_30MIN`
  - 정보 업데이트: `CONCERT_INFO_UPDATE_{SETLIST,MD,DETAIL,SCHEDULE,TICKET}`
  - 기타: `ARTIST_CONCERT_OPEN`, `RECOMMEND`
- 알림 발송은 `notification/strategies/notification-strategy.service.ts`가 타입별 Strategy로 위임 (switch + default throw).

## Deployment

- CI/CD via GitHub Actions (`.github/workflows/deploy-main.yml`)
- Deploys to AWS EC2 via rsync + systemd
- 트리거 브랜치 3종 → 대상 매핑:
  - `develop` → dev EC2 (`/opt/app`, `app.service`)
  - `main` → prod EC2 (`/opt/app`, `app.service`)
  - `legacy` → prod EC2 (`/opt/app-legacy`, `app-legacy.service`)
- prisma 마이그레이션은 `prisma/**` 변경 감지 시에만 `migrate deploy` 실행 (`dorny/paths-filter`).