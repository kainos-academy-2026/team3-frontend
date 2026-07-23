---
applyTo: "bods/**"
description: "BDD test instructions for US051: Create Job Role. Covers the happy path, validation errors, non-admin access, and unauthenticated access scenarios using Cucumber, Playwright, and TypeScript."
---

# BDD Test Instructions: Create Job Role (US051)

## Overview

These instructions define the BDD acceptance tests for the create job role feature using the current project setup: Cucumber + Playwright + TypeScript in ESM mode.

Tests run against a live frontend and backend (both servers must be running).

- Admin and user credentials come from fixed environment variables.
- JWT is obtained via a backend login endpoint during setup.
- Created roles are deleted in the `After` hook via authenticated `DELETE /api/job-roles/:id`.
- The created role ID is obtained using a dedicated test lookup endpoint.

This file intentionally does not assume missing backend contracts. Required unknown contracts are listed in the Open Contracts section.

---

## Runtime Setup (Current Repo)

Use the existing BDD runtime conventions from `package.json` and `bods/fixtures/bods.fixture.ts`.

- Command: `npm run test:bdd`
- Cucumber loading model: `ts-node/esm` loader with `--import` entries.
- World pattern: `BddWorld extends World`.
- Default frontend base URL: `http://127.0.0.1:3000`.
- Canonical BDD environment variables:
  - `BDD_BASE_URL`
  - `BDD_HEADLESS`
  - `BDD_SLOW_MO`

Credential environment variables for this feature:

- `TEST_ADMIN_EMAIL`
- `TEST_ADMIN_PASSWORD`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

If your team uses different variable names, update this file and the fixture in the same PR.

---

## Open Contracts (Must Be Confirmed)

The following backend contracts are required before final implementation:

1. Login endpoint contract used to obtain JWT in setup:
  - method + path
  - request payload shape
  - response payload shape (token field name)
2. Dedicated test endpoint contract used to resolve the created role ID after create success:
  - method + path
  - request query/body shape
  - response payload shape (`roleId` or equivalent)

Do not hardcode assumptions for these two endpoints.

---

## Scenarios

| # | Tag | Description |
|---|---|---|
| 1 | `@smoke` | Admin creates a valid role and sees the success banner |
| 2 | | Admin submits invalid data and sees field-level error messages |
| 3 | | Non-admin user is denied access and sees a permission error |
| 4 | | Unauthenticated user is redirected to the login page |

---

## Files To Create

| File | Purpose |
|---|---|
| `bods/fixtures/bods.fixture.ts` | `BddWorld` class + `BeforeAll`, `AfterAll`, `Before`, `After` hooks |
| `bods/data/jobRoles.ts` | `buildJobRoleData()` builder with valid defaults and overrides |
| `bods/pages/SignInPage.ts` | Page object for `/login` |
| `bods/pages/JobRoleListPage.ts` | Page object for `/job-roles` |
| `bods/pages/CreateJobRolePage.ts` | Page object for `/job-roles/new` |
| `bods/steps/create-role.steps.ts` | Step definitions for all scenarios |
| `bods/features/create-role.feature` | Gherkin feature file |

---

## Phase 1 — BddWorld Fixture

**File:** `bods/fixtures/bods.fixture.ts`

Keep the fixture aligned with the existing repository style:

- `BddWorld` extends `World` from `@cucumber/cucumber`.
- Use `setWorldConstructor(BddWorld)`.
- Keep nullable scenario state on World (`page`, `context`, `requestContext`, etc.).
- Create fresh browser context and request context in `Before`.
- Close page/context/requestContext in `After`.
- Launch/close browser once in `BeforeAll`/`AfterAll`.
- Keep `setDefaultTimeout(30_000)`.

```typescript
import process from "node:process";
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  type IWorldOptions,
  setDefaultTimeout,
  setWorldConstructor,
  World,
} from "@cucumber/cucumber";
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
  request,
} from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

let browser: Browser;

setDefaultTimeout(30_000);

export class BddWorld extends World {
  baseUrl: string;
  context: BrowserContext | null;
  page: Page | null;
  requestContext: APIRequestContext | null;

  adminJwt: string | null;
  adminEmail: string | null;
  adminPassword: string | null;
  createdRoleId: number | null;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = process.env.BDD_BASE_URL ?? DEFAULT_BASE_URL;
    this.context = null;
    this.page = null;
    this.requestContext = null;
    this.adminJwt = null;
    this.adminEmail = null;
    this.adminPassword = null;
    this.createdRoleId = null;
  }
}

setWorldConstructor(BddWorld);

BeforeAll(async () => {
  browser = await chromium.launch({
    headless: process.env.BDD_HEADLESS !== "false",
    slowMo: Number(process.env.BDD_SLOW_MO ?? 0),
  });
});

Before(async function (this: BddWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
  this.requestContext = await request.newContext({ baseURL: this.baseUrl });
});

After(async function (this: BddWorld) {
  if (this.createdRoleId !== null && this.adminJwt !== null) {
    await this.requestContext?.delete(`/job-roles/${this.createdRoleId}`, {
      headers: { Authorization: `Bearer ${this.adminJwt}` },
    });
  }

  await this.page?.close();
  await this.context?.close();
  await this.requestContext?.dispose();

  this.page = null;
  this.context = null;
  this.requestContext = null;
  this.createdRoleId = null;
  this.adminJwt = null;
  this.adminEmail = null;
  this.adminPassword = null;
});

AfterAll(async () => {
  await browser.close();
});
```

### Auth Source and Token Flow

Credentials are sourced from environment variables:

- admin: `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`
- regular user: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`

The setup step must also call the backend login endpoint to obtain an admin JWT and store it on World for cleanup calls.

> Endpoint details are currently unknown. Add the exact contract in Open Contracts before implementing steps.

---

## Phase 2 — Test Data Builder

**File:** `bods/data/jobRoles.ts`

Export a `CreateRoleInput` type and a `buildJobRoleData` builder. Defaults must produce a payload that passes all frontend Zod validation rules.

```typescript
export type CreateRoleInput = {
  roleName: string;
  location: string;
  capabilityOption: string; // visible label in the <select> dropdown
  bandOption: string;       // visible label in the <select> dropdown
  closingDate: string;      // YYYY-MM-DD
  numberOfOpenPositions: string;
  description: string;
  responsibilities: string;
  sharepointUrl: string;
};

export function buildJobRoleData(
  overrides: Partial<CreateRoleInput> = {},
): CreateRoleInput {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const closingDate = futureDate.toISOString().split('T')[0];

  return {
    roleName: 'BDD Test Role',
    location: 'Belfast',
    capabilityOption: '',   // set at runtime — select first non-empty option
    bandOption: '',         // set at runtime — select first non-empty option
    closingDate,
    numberOfOpenPositions: '1',
    description: 'A role created during BDD test execution.',
    responsibilities: 'Responsibilities defined during BDD test execution.',
    sharepointUrl: 'https://example.sharepoint.com/sites/bdd-test-role',
    ...overrides,
  };
}
```

> **Note on capability and band:** These values are populated at runtime from the backend metadata API. The page object's `fillForm` method should select the **first available non-empty option** from each dropdown unless an override is provided. This avoids hardcoding IDs that may change between environments.

---

## Phase 3 — Page Objects

### `bods/pages/SignInPage.ts`

Exposes the login form on `/login`.

```typescript
import { type Page } from '@playwright/test';

export class SignInPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    await this.page.waitForURL('**/job-roles');
  }
}
```

### `bods/pages/JobRoleListPage.ts`

Exposes the job roles list on `/job-roles`.

```typescript
import { type Locator, type Page } from '@playwright/test';

export class JobRoleListPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/job-roles');
  }

  getCreateRoleButton(): Locator {
    return this.page.getByRole('link', { name: 'Create new role' });
  }

  getSuccessBanner(): Locator {
    return this.page.getByRole('status', { name: /job role created successfully/i });
  }
}
```

### `bods/pages/CreateJobRolePage.ts`

Exposes the create role form on `/job-roles/new`.

```typescript
import { type Locator, type Page } from '@playwright/test';
import type { CreateRoleInput } from '../data/jobRoles.ts';

export class CreateJobRolePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/job-roles/new');
  }

  async fillForm(data: Partial<CreateRoleInput>): Promise<void> {
    if (data.roleName !== undefined) {
      await this.page.getByLabel('Role name').fill(data.roleName);
    }
    if (data.location !== undefined) {
      await this.page.getByLabel('Location').fill(data.location);
    }
    if (data.closingDate !== undefined) {
      await this.page.getByLabel('Closing date').fill(data.closingDate);
    }
    if (data.numberOfOpenPositions !== undefined) {
      await this.page.getByLabel('Number of open positions').fill(data.numberOfOpenPositions);
    }
    if (data.description !== undefined) {
      await this.page.getByLabel('Description').fill(data.description);
    }
    if (data.responsibilities !== undefined) {
      await this.page.getByLabel('Responsibilities').fill(data.responsibilities);
    }
    if (data.sharepointUrl !== undefined) {
      await this.page.getByLabel('SharePoint URL').fill(data.sharepointUrl);
    }

    // Selects: pick the first non-empty option unless overrides are provided
    const capabilitySelect = this.page.getByLabel('Capability');
    if (data.capabilityOption) {
      await capabilitySelect.selectOption({ label: data.capabilityOption });
    } else {
      const options = await capabilitySelect.locator('option').all();
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val) {
          await capabilitySelect.selectOption(val);
          break;
        }
      }
    }

    const bandSelect = this.page.getByLabel('Band');
    if (data.bandOption) {
      await bandSelect.selectOption({ label: data.bandOption });
    } else {
      const options = await bandSelect.locator('option').all();
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val) {
          await bandSelect.selectOption(val);
          break;
        }
      }
    }
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create role' }).click();
  }

  getFieldError(labelText: string): Locator {
    // Finds the error message that follows the field identified by labelText.
    // Uses the label's `for` attribute to locate the associated input/select/textarea,
    // then finds the sibling error paragraph within the same form field wrapper.
    return this.page
      .locator('.job-role-form__field')
      .filter({ has: this.page.getByText(labelText, { exact: true }) })
      .locator('.job-role-form__field-error');
  }

  getFormError(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /.+/ });
  }
}
```

Use TypeScript extension imports (`.ts`) in BDD source files to match the current repository setup.

---

## Phase 4 — Feature File

**File:** `bods/features/create-role.feature`

Keep language business-facing. No CSS selectors, IDs, or HTML details.

```gherkin
@ui @bdd @create-role
Feature: Create Job Role
  To manage open positions at Kainos
  As an admin
  I want to create a new job role from the frontend

  Rule: Admins can create job roles

    Background:
      Given I am logged in as an admin

    @smoke
    Scenario: Admin creates a valid job role and sees a success message
      When I click the "Create new role" button on the job roles list
      And I fill in the role details with valid data
      And I submit the create role form
      Then I should be on the job roles list page
      And I should see the success message "Job role created successfully."

    Scenario: Admin submits the form with missing role name and invalid SharePoint URL
      When I click the "Create new role" button on the job roles list
      And I submit the create role form without a role name and with an invalid SharePoint URL
      Then I should remain on the create role form
      And I should see a field error for "Role name"
      And I should see a field error for "SharePoint URL"

  Rule: Access to the create role form is restricted

    Scenario: Non-admin user cannot access the create role form
      Given I am logged in as a regular user
      When I navigate directly to the create role form
      Then I should see "You do not have permission to access this page."

    Scenario: Unauthenticated user is redirected to the login page
      Given I am not logged in
      When I navigate directly to the create role form
      Then I should be on the login page
```

---

## Phase 5 — Step Definitions

**File:** `bods/steps/create-role.steps.ts`

All browser interactions must delegate to page objects. Use `this: BddWorld` typed context throughout.

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { BddWorld } from '../fixtures/bods.fixture.ts';
import { SignInPage } from '../pages/SignInPage.ts';
import { JobRoleListPage } from '../pages/JobRoleListPage.ts';
import { CreateJobRolePage } from '../pages/CreateJobRolePage.ts';
import { buildJobRoleData } from '../data/jobRoles.ts';

function ensurePage(world: BddWorld) {
  if (!world.page) {
    throw new Error('Browser page was not initialised.');
  }
  return world.page;
}

function ensureRequestContext(world: BddWorld) {
  if (!world.requestContext) {
    throw new Error('Request context was not initialised.');
  }
  return world.requestContext;
}

// ---------------------------------------------------------------------------
// Auth steps
// ---------------------------------------------------------------------------

Given('I am logged in as an admin', async function (this: BddWorld) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD environment variables.');
  }

  const requestContext = ensureRequestContext(this);

  // TODO: replace with exact backend login contract once confirmed.
  const loginResponse = await requestContext.post('/<login-endpoint-path>', {
    data: { email, password },
  });
  const loginBody = (await loginResponse.json()) as { token: string };
  this.adminJwt = loginBody.token;

  this.adminEmail = email;
  this.adminPassword = password;

  const signInPage = new SignInPage(ensurePage(this));
  await signInPage.goto();
  await signInPage.login(email, password);
});

Given('I am logged in as a regular user', async function (this: BddWorld) {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables.');
  }

  const signInPage = new SignInPage(ensurePage(this));
  await signInPage.goto();
  await signInPage.login(email, password);
});

Given('I am not logged in', function (this: BddWorld) {
  // No action needed — each scenario starts with a fresh, unauthenticated browser context.
});

// ---------------------------------------------------------------------------
// Navigation steps
// ---------------------------------------------------------------------------

When(
  'I click the "Create new role" button on the job roles list',
  async function (this: BddWorld) {
    const page = ensurePage(this);
    const listPage = new JobRoleListPage(page);
    await listPage.goto();
    await listPage.getCreateRoleButton().click();
    await page.waitForURL('**/job-roles/new');
  },
);

When('I navigate directly to the create role form', async function (this: BddWorld) {
  await ensurePage(this).goto('/job-roles/new');
});

// ---------------------------------------------------------------------------
// Form steps
// ---------------------------------------------------------------------------

When('I fill in the role details with valid data', async function (this: BddWorld) {
  const createPage = new CreateJobRolePage(ensurePage(this));
  await createPage.fillForm(buildJobRoleData());
});

When(
  'I submit the create role form without a role name and with an invalid SharePoint URL',
  async function (this: BddWorld) {
    const createPage = new CreateJobRolePage(ensurePage(this));
    await createPage.fillForm(
      buildJobRoleData({ roleName: '', sharepointUrl: 'not-a-valid-url' }),
    );
    await createPage.submit();
  },
);

When('I submit the create role form', async function (this: BddWorld) {
  const page = ensurePage(this);
  const requestContext = ensureRequestContext(this);
  const createPage = new CreateJobRolePage(page);
  await createPage.submit();
  await page.waitForURL('**/job-roles**created=true**');

  // TODO: replace with exact created-role lookup contract once confirmed.
  const lookupResponse = await requestContext.post('/<created-role-lookup-endpoint>', {
    data: {
      createdByEmail: this.adminEmail,
      roleName: 'BDD Test Role',
    },
    headers: this.adminJwt
      ? { Authorization: `Bearer ${this.adminJwt}` }
      : undefined,
  });
  const lookupBody = (await lookupResponse.json()) as { roleId: number };
  if (Number.isInteger(lookupBody.roleId) && lookupBody.roleId > 0) {
    this.createdRoleId = lookupBody.roleId;
  }
});

// ---------------------------------------------------------------------------
// Assertion steps
// ---------------------------------------------------------------------------

Then('I should be on the job roles list page', async function (this: BddWorld) {
  await expect(ensurePage(this)).toHaveURL(/\/job-roles(\?|$)/);
});

Then(
  'I should see the success message {string}',
  async function (this: BddWorld, message: string) {
    const listPage = new JobRoleListPage(ensurePage(this));
    await expect(listPage.getSuccessBanner()).toContainText(message);
  },
);

Then('I should remain on the create role form', async function (this: BddWorld) {
  await expect(ensurePage(this)).toHaveURL(/\/job-roles\/new/);
});

Then(
  'I should see a field error for {string}',
  async function (this: BddWorld, labelText: string) {
    const createPage = new CreateJobRolePage(ensurePage(this));
    await expect(createPage.getFieldError(labelText)).toBeVisible();
  },
);

Then(
  'I should see {string}',
  async function (this: BddWorld, text: string) {
    await expect(ensurePage(this).getByText(text)).toBeVisible();
  },
);

Then('I should be on the login page', async function (this: BddWorld) {
  await expect(ensurePage(this)).toHaveURL(/\/login/);
});
```

### Capturing the Created Role ID

After a successful create, the controller redirects to `/job-roles?created=true`. The created role ID is not present in that URL.

Use the dedicated test lookup endpoint to resolve created role ID, then store it on `this.createdRoleId` for the `After` cleanup hook.

Cleanup call remains:

- `DELETE /api/job-roles/:id`
- Header: `Authorization: Bearer <admin-jwt>`

> The dedicated lookup endpoint contract must be confirmed and documented in this file before implementation.

---

## Verification

Run all scenarios:
```bash
npm run test:bdd
```

Run only the smoke scenario:
```bash
npm run test:bdd -- --tags @smoke
```

Run only the access control scenarios:
```bash
npm run test:bdd -- --tags "@create-role and not @smoke"
```

### Definition of Done

A test implementation is complete when all of the following are true:

- [ ] All 4 scenarios pass in repeated local runs with both servers running.
- [ ] `@smoke` scenario passes in isolation (`--tags @smoke`).
- [ ] Each scenario can run alone and in the full suite (no shared mutable state).
- [ ] The After hook successfully deletes the created role (verify by checking the job roles list after the run has no BDD Test Role entries).
- [ ] No CSS selectors or element IDs appear in step definitions — all interactions go through page objects using `getByLabel`, `getByRole`, or `getByText`.
- [ ] Login endpoint contract is documented and wired for JWT retrieval.
- [ ] Created-role lookup endpoint contract is documented and wired for cleanup ID resolution.
