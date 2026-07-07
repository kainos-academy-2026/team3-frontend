# team3-frontend

Frontend application for Team 3 project.

## Prerequisites
Before you start, make sure you have:

- Node.js (recommended: version 20)
- npm (comes with Node.js)
You can check your versions with:

```bash
node -v
```
```bash
npm -v
```

## Install Dependencies
From the frontend project root, run:
```bash
npm install
```

## Running the App
### Development mode (auto-reload)
```bash
npm run dev
```
This starts the app in watch mode for local development.

### Production mode
1. Build the project:
```bash
npm run build
```
2. Start the built output:
```bash
npm run start
```
## Build
To compile TypeScript into the dist folder:
```bash
npm run build
```
## Testing
Run all tests once
```bash
npm test
```
Run tests with UI
```bash
npm run test:ui
```
Run tests with coverage
```bash
npm run test:coverage
```
## Linting
Run lint checks
```bash
npm run lint
```
Auto-fix lint/format issues (safe command)
    npx biome check --write .
CI lint check (no file changes)
```bash
npm run lint:ci
```
## Migrations
Frontend migrations: Not applicable.

This frontend app does not manage a database schema, so migration commands are only required in the API/backend repository.

## Quick Command Reference
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Start: npm run start
- Test: npm test
- Test UI: npm run test:ui
- Coverage: npm run test:coverage
- Lint: npm run lint
- Lint fix: npm run lint:fix
- Lint CI: npm run lint:ci
## CI/CD Note
The CI pipeline should use these core checks:

- npm run build
- npm run lint:ci
- npm test
These are the same checks used to validate pull requests before merge.