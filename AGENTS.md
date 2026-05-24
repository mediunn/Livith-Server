# Repository Guidelines

## Project Structure & Module Organization
- Main source code is under `src/`, organized by NestJS domain modules (for example `src/auth`, `src/notification`, `src/user`).
- Shared utilities, interceptors, enums, and pipes live in `src/common`.
- Database schema and migrations are in `prisma/` (`schema.prisma`, `migrations/`).
- Unit/integration specs are colocated as `*.spec.ts` in `src/`; end-to-end tests are in `test/` (`*.e2e-spec.ts`).
- Performance test scripts are in `k6/` (`smoke.ts`, `load.ts`).
- Build artifacts are generated to `dist/`.

## Build, Test, and Development Commands
- `npm run start:dev` — run Nest server with watch mode for local development.
- `npm run build` — compile TypeScript to `dist/`.
- `npm run start:prod` — run compiled app from `dist/src/main`.
- `npm run lint` — run ESLint with auto-fixes on `src/` and `test/`.
- `npm run format` — run Prettier on `src/**/*.ts` and `test/**/*.ts`.
- `npm run test` — run unit tests (`*.spec.ts`).
- `npm run test:e2e` — run e2e tests via `test/jest-e2e.json`.
- `npm run test:cov` — run tests with coverage output.
- `npm run perf:smoke:local` / `npm run perf:load:local` — run local k6 performance scenarios.

## Coding Style & Naming Conventions
- Language: TypeScript with NestJS patterns (module/service/controller separation).
- Formatting: Prettier (`.prettierrc`) with 2-space indentation and single quotes.
- Linting: ESLint (`.eslintrc.js`) + `@typescript-eslint` + Prettier integration.
- Naming:
  - Files: kebab-case (e.g., `notification-dispatch.service.ts`)
  - Classes/DTOs/Enums: PascalCase
  - Variables/functions: camelCase
  - Constants: UPPER_SNAKE_CASE

## Testing Guidelines
- Use Jest for unit/integration and Supertest for HTTP/e2e flows.
- Keep tests near implementation as `*.spec.ts`; use `test/*.e2e-spec.ts` for end-to-end.
- Prefer focused service/controller tests first, then broader module/e2e coverage.
- Run `npm run test` before opening a PR; include `npm run test:e2e` for API-affecting changes.

## Commit & Pull Request Guidelines
- Follow existing commit style: conventional type prefixes such as `feat:`, `fix:`, `refactor:`, `test:` (emoji prefix is optional).
- Keep commits scoped and atomic (one concern per commit).
- PRs should include:
  - clear summary and rationale,
  - linked issue (e.g., `#291`) when applicable,
  - test evidence (command + result),
  - API/behavior changes and sample request/response when relevant.

## Security & Configuration Tips
- Never commit secrets or key files; use `.env` for local config.
- Validate Prisma migrations carefully before production deploys.
- For notification/external API changes, add timeout/retry/error logging and verify metrics exposure.
