# Testing Setup for Hiresight Backend

## Overview

This testing setup uses **Jest** and **Supertest** for comprehensive testing of the Hiresight backend API.

## Test Structure

```
server/
├── __tests__/
│   ├── unit/                    # Unit tests (focused, fast)
│   │   ├── services/           # Business logic tests
│   │   │   ├── auth.service.test.ts
│   │   │   └── aptitude.service.test.ts
│   │   └── utils/              # Utility function tests
│   │       └── authUtils.test.ts
│   ├── integration/            # Integration tests (API routes)
│   │   ├── auth.routes.test.ts
│   │   └── aptitude.routes.test.ts
│   └── helpers/                # Test utilities
│       ├── dbSetup.ts         # Database setup/teardown
│       ├── mocks.ts           # Mock objects and factories
│       └── testUtils.ts       # Test helper functions
├── jest.config.js              # Jest configuration
├── jest.setup.ts              # Global test setup
└── package.json               # Test scripts
```

## Key Features

- **Focused Unit Tests**: Small, fast tests for individual functions (~150 lines max)
- **Integration Tests**: API endpoint testing with real database
- **Database Isolation**: Each test runs with clean database state
- **Mocked External Services**: Google OAuth and Redis are mocked
- **TypeScript Support**: Full TypeScript integration with Jest

## Available Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Environment Setup

1. **Test Database**: Use a separate test database
   ```env
   NODE_ENV=test
   TEST_DATABASE_URL=postgresql://user:password@localhost:5432/hiresight_test
   JWT_SECRET=test-jwt-secret
   JWT_REFRESH_SECRET=test-refresh-secret
   ```

2. **Prisma Setup**: Ensure test database is migrated
   ```bash
   npx prisma migrate dev
   ```

## Test Best Practices

- ✅ Keep unit tests small and focused
- ✅ Use descriptive test names
- ✅ Clean database state before each test
- ✅ Mock external dependencies
- ✅ Test both success and error cases
- ✅ Use factories for test data creation

## Example Test Run

```bash
npm test

> hiresight-backend@1.0.0 test
> NODE_ENV=test jest

 PASS  __tests__/uit/utils/authUtils.test.ts
 PASS  __tests__/unit/services/auth.service.test.ts
 PASS  __tests__/unit/services/aptitude.service.test.ts
 PASS  __tests__/integration/auth.routes.test.ts
 PASS  __tests__/integration/aptitude.routes.test.ts

Test Suites: 5 passed, 5 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        3.847 s
```
