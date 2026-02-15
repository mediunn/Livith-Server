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

NestJS modular architecture with 11 feature modules registered in `src/app.module.ts`:

- **auth** - OAuth (Kakao/Apple) login + JWT token issuance. Passport strategies in `auth/strategies/`, guards in `auth/guards/`.
- **concert** - Core concert CRUD with status tracking (ONGOING, UPCOMING, COMPLETED, CANCELED).
- **notification** - FCM push notifications with scheduled delivery. Has sub-structure: `fcm/` (Firebase init), `scheduler/` (cron jobs for queue processing, ticketing reminders, cleanup), `service/`, `enums/`, `constants/`.
- **recommendation** - Genre/artist-based recommendations. Integrates with LastFM and YouTube APIs via `integrations/`. Uses `music-api-factory.service.ts` pattern.
- **setlist** - Concert setlists with songs and fanchants.
- **song** - Song details including lyrics, pronunciation, translation.
- **comment** - User comments on concerts with reporting.
- **user** - User management, favorite artists/genres.
- **home** / **search** - Home page sections and search functionality.
- **genre** - Genre catalog management.

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
- Notification types are enumerated in `NotificationType` (INTEREST_CONCERT, TICKET_7D, TICKET_1D, TICKET_TODAY, etc.).

## Deployment

- CI/CD via GitHub Actions (`.github/workflows/deploy-main.yml`)
- Deploys to AWS EC2 via rsync + systemd
- `develop` branch → staging server, `main` branch → production server
