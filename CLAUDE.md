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
npm run test:e2e           # E2E tests
npx prisma migrate dev     # Apply pending migrations
npx prisma generate        # Regenerate Prisma client after schema changes
```

Run a single test file: `npx jest --config package.json <path-to-spec>`

Swagger docs available at `http://localhost:3000/api-docs` when server is running.

## Architecture

### Module Structure

NestJS modular architecture with 14 feature modules registered in `src/app.module.ts`:

- **auth** - OAuth (Kakao/Apple) login + JWT token issuance. Passport strategies in `auth/strategies/`, guards in `auth/guards/`.
- **concert** - Core concert CRUD with status tracking (ONGOING, UPCOMING, COMPLETED, CANCELED).
- **notification** - FCM push notifications with scheduled delivery. Has sub-structure: `fcm/` (Firebase init), `scheduler/` (cron jobs for queue processing, ticketing reminders, cleanup), `service/`, `enums/`, `constants/`.
- **recommendation** - Genre/artist-based recommendations. Integrates with LastFM/Spotify/YouTube via `integrations/`. Uses `music-api-factory.service.ts` pattern. LastFM rate limit 방어를 위해 `utils/`에 3-레이어 구조 구현: `SwrCache` (LRU + Stale-While-Revalidate) → `InFlightCoalescing` → `Bottleneck` (Token Bucket + 지수 백오프 retry).
- **artist** - 아티스트 매칭 서비스 (`service/artist-matching.service.ts`).
- **setlist** - Concert setlists with songs and fanchants.
- **song** - Song details including lyrics, pronunciation, translation.
- **comment** - User comments on concerts with reporting.
- **user** - User management, favorite artists/genres.
- **home** / **search** - Home page sections and search functionality.
- **genre** - Genre catalog management.
- **metrics** - Prometheus 메트릭 수집. `HttpMetricsInterceptor`로 전역 등록 (`http_request_total`, `http_request_duration_seconds`, `http_requests_in_flight`). `@InstrumentJob` 데코레이터로 스케줄러 메트릭도 수집.
- **logger** - Winston + OpenTelemetry 연동. 모든 로그에 `traceId`/`spanId` 자동 주입. `@Global()` 모듈로 등록.

### Cross-Cutting Concerns (`src/common/`)

- **GlobalExceptionFilter** (`filters/`) - Unified error responses using `BusinessException` and `ErrorCode` enum.
- **GlobalResponseInterceptor** (`interceptors/`) - Wraps all responses in `{ message, data, statusCode }` format. Adds ETag caching for GET requests.
- **@CurrentUser decorator** (`decorator/`) - Extracts JWT payload in controllers.
- **Error codes** (`enums/error-code.enum.ts`) - Centralized error code definitions.
- **API prefix** (`constants/api-prefix.ts`) - Currently `api/v5`.

### Database

- **Schema**: `prisma/schema.prisma` (~25 models). Key models: Concert, Artist, Setlist, SetlistSong, Song, User, FcmToken, NotificationSet, ConcertNotificationQueue.
- **PrismaModule** (`prisma/prisma.module.ts`) - Shared module exporting `PrismaService`. Imported by feature modules that need DB access.
- **Migrations**: `prisma/migrations/` (83+ migration files).
- **Meilisearch** - 아티스트 검색 엔진 (추가 예정). `searchableAttributes: ["artistName", "searchNames"]`, `filterableAttributes: ["genreId"]`. Artist 생성/수정 시 인덱스 동기화.

### Observability

- **OpenTelemetry** - `src/tracing.ts`에서 초기화. Tempo로 분산 트레이스 수집.
- **Loki** - Winston JSON 로그 수집. 로그에 traceId 포함되어 Tempo 트레이스와 연동.
- **Prometheus + Grafana** - HTTP 메트릭 및 스케줄러 메트릭 시각화.
- k6로 부하 테스트 (`chore/#247-k6-test` 브랜치 참고).

### Global Middleware (configured in `src/main.ts`)

- `ValidationPipe` with whitelist, transform, forbidNonWhitelisted
- `cookieParser`, `express-session` (24h expiry)
- CORS enabled for localhost:5173, livith.site, staging.livith.site

## Conventions

### Git

- **Branches**: `main` (production), `develop` (development/PRs target here)
- **Branch naming**: `{type}/#{issue-number}-description` (e.g., `feat/#123-user-login-api`)
- **Commit format**: `{emoji} {type}: description`
  - `✨ feat:` / `🐛 fix:` / `📝 docs:` / `♻️ refactor:` / `🎨 style:` / `🔧 chore:` / `🔥 remove:` / `🚀 deploy:`

### Code Patterns

- Each feature module follows Controller → Service → PrismaService pattern.
- DTOs use `class-validator` decorators for request validation and `@ApiProperty()` for Swagger.
- Dates handled with `dayjs` (see `common/utils/date.util.ts`).
- Notification types are enumerated in `NotificationType` (INTEREST_CONCERT, PRE_TICKETING_OPEN, GENERAL_TICKETING_OPEN, PRE_TICKETING_1D, GENERAL_TICKETING_1D, PRE_TICKETING_30MIN, GENERAL_TICKETING_30MIN, etc.).

## Deployment

- CI/CD via GitHub Actions (`.github/workflows/deploy-main.yml`)
- Deploys to AWS EC2 via rsync + systemd
- `develop` branch → staging server, `main` branch → production server
