---
applyTo: "bods/**"
description: "BDD test standards and implementation guide for US015 Edit Job Role As An Admin feature. Covers Gherkin authoring, step definitions, page objects, data builders, and CI/CD integration."
---

# Edit Job Role BDD Test Standards — US015

## Purpose

This file defines how to write and maintain behavior-driven tests for the **Edit Job Role** feature using Cucumber, Playwright, and TypeScript.

Tests must be:
- **readable** by business stakeholders (Gherkin only)
- **deterministic** in CI/CD
- **independent** and runnable in any order
- **maintainable** with clear page objects and typed data builders

---

## Canonical Structure

Keep all BDD assets under `bods/`:

```text
bods/
  data/           # typed builders and test data generators
    jobRoles.ts   # job role test data, builders, and parsers
  features/       # .feature files written in Gherkin
    edit-job-role.feature
  fixtures/       # shared World, hooks, browser setup
    bods.world.ts
    bods.hooks.ts
  pages/          # page objects for UI interactions
    EditJobRolePage.ts
    JobRoleDetailPage.ts
  steps/          # step definitions (Given/When/Then)
    edit-job-role.steps.ts
```

---

## Naming Standards

| Artifact | Pattern | Example |
|---|---|---|
| Feature files | kebab-case, action-oriented | `edit-job-role.feature` |
| Step files | match feature name | `edit-job-role.steps.ts` |
| Page objects | PascalCase + `Page` suffix | `EditJobRolePage.ts` |
| Data helpers | domain noun pluralized | `jobRoles.ts` |
| Scenario titles | observable behavior | "Admin edits all job role fields" |

---

## Gherkin Authoring Standards for Edit Job Role

### 1) Feature File Structure

```gherkin
@ui @admin @edit-job-role
Feature: Admin edits job roles
  To maintain accurate job posting information
  As an admin
  I want to edit existing job role details

  Background:
    Given I am authenticated as an admin
    And a job role exists with default details
```

### 2) Scenario Template

Each scenario must follow:

```gherkin
Scenario: <observable outcome>
  Given <precondition>
  When <single user action>
  Then <expected result>
```

### 3) Edit Job Role Scenarios

**Happy Path:**
```gherkin
Scenario: Admin successfully edits all job role fields
  When I navigate to the edit page for the job role
  And I update all fields with valid data
  And I submit the form
  Then I should be redirected to the job role detail page
  And I should see a success banner
  And the detail page displays the updated values
```

**Partial Update:**
```gherkin
Scenario: Admin edits only some fields
  When I navigate to the edit page
  And I update only the role name and location
  And I submit the form
  Then the detail page shows the updated role name and location
  And unchanged fields retain their original values
```

**Validation Error:**
```gherkin
Scenario: Admin sees error when submitting empty role name
  When I navigate to the edit page
  And I clear the role name field
  And I submit the form
  Then I remain on the edit page
  And I see the error message "Role name is required."
  And my previous entries are preserved
```

**Authorization:**
```gherkin
Scenario: Non-admin user cannot access the edit page
  Given I am authenticated as a regular user
  When I try to navigate to the edit page
  Then I receive a 403 Forbidden response
```

### 4) Gherkin Do's and Don'ts

✅ **DO:**
- Use realistic data values (dates, URLs, counts)
- Name scenarios after observable behavior, not steps
- Use `Background` for common setup
- Use data tables for complex inputs

❌ **DON'T:**
- Include UI implementation details (selectors, IDs)
- Write scenarios that test multiple unrelated behaviors
- Hard-code waits instead of asserting state
- Use vague names like "works correctly"

---

## Step Definition Standards

### 1) File Location and Imports

```typescript
// bods/steps/edit-job-role.steps.ts
import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BddWorld } from '../fixtures/bods.world';
import { EditJobRolePage } from '../pages/EditJobRolePage';
import { buildJobRole } from '../data/jobRoles';
```

### 2) Step Definition Patterns

**Given (Precondition):**
```typescript
Given('I am authenticated as an admin', async function (this: BddWorld) {
  await this.loginAsAdmin();
});

Given('a job role exists with default details', async function (this: BddWorld) {
  const jobRole = buildJobRole();
  this.currentJobRole = await this.seedJobRoleViaAPI(jobRole);
});
```

**When (Action):**
```typescript
When('I navigate to the edit page for the job role', async function (this: BddWorld) {
  this.editPage = new EditJobRolePage(this.page!);
  await this.editPage.goto(this.currentJobRole.id);
});

When('I update all fields with valid data', async function (this: BddWorld) {
  const updatedData = {
    roleName: 'Senior Principal Engineer',
    location: 'London',
    description: 'Lead technical strategy',
    numberOfOpenPositions: 3,
  };
  await this.editPage.fillForm(updatedData);
});

When('I submit the form', async function (this: BddWorld) {
  await this.editPage.submit();
  await this.page!.waitForLoadState('networkidle');
});
```

**Then (Assertion):**
```typescript
Then('I should be redirected to the job role detail page', async function (this: BddWorld) {
  await expect(this.page!).toHaveURL(
    `/job-roles/${this.currentJobRole.id}`,
  );
});

Then('I should see a success banner', async function (this: BddWorld) {
  const banner = this.page!.locator('[role="alert"]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Job role updated successfully');
});

Then('I see the error message {string}', async function (this: BddWorld, message: string) {
  const error = this.page!.locator(`text="${message}"`);
  await expect(error).toBeVisible();
});
```

### 3) Step Quality Rules

- Keep step bodies short and focused.
- Put all browser interactions into **page objects**, not steps.
- Use typed World context: `this: BddWorld`.
- Return data only from `Given` steps when needed for later steps.
- Clean up test data in `After` hooks.

---

## World + Hooks Standards

### 1) World Definition

```typescript
// bods/fixtures/bods.world.ts
import { IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export interface BddWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  currentJobRole?: any;
  [key: string]: any;
}

class World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  currentJobRole?: any;

  constructor(_options: IWorldOptions) {}
}

setWorldConstructor(World);
```

### 2) Hooks

```typescript
// bods/fixtures/bods.hooks.ts
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { BddWorld } from './bods.world';

let globalBrowser: Browser;

BeforeAll(async function () {
  globalBrowser = await chromium.launch();
});

Before(async function (this: BddWorld) {
  this.context = await globalBrowser.newContext();
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(10000);
});

After(async function (this: BddWorld) {
  // Clean up test data created during scenario
  if (this.currentJobRole?.id) {
    await this.deleteJobRoleViaAPI(this.currentJobRole.id);
  }
  
  // Close browser context
  await this.context?.close();
});

AfterAll(async function () {
  await globalBrowser.close();
});
```

### 3) Environment Defaults

- **Base URL:** `http://127.0.0.1:3000` (configurable via `.env`)
- **Default timeout:** 10 seconds
- **Network idle before assertions:** always wait for `networkidle`

---

## Page Object Standards

### 1) EditJobRolePage Example

```typescript
// bods/pages/EditJobRolePage.ts
import { type Locator, type Page, expect } from '@playwright/test';

export class EditJobRolePage {
  readonly page: Page;
  readonly roleNameInput: Locator;
  readonly locationInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.roleNameInput = page.getByLabel('Role Name');
    this.locationInput = page.getByLabel('Location');
    this.descriptionTextarea = page.getByLabel('Description');
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto(jobRoleId: number): Promise<void> {
    await this.page.goto(`/job-roles/${jobRoleId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: Partial<JobRoleEditInput>): Promise<void> {
    if (data.roleName) {
      await this.roleNameInput.fill(data.roleName);
    }
    if (data.location) {
      await this.locationInput.fill(data.location);
    }
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }
    // ... other fields
  }

  async clearField(fieldName: string): Promise<void> {
    const field = this.page.getByLabel(fieldName);
    await field.clear();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    return this.errorAlert.textContent();
  }
}
```

### 2) Page Object API Rules

- Expose **user-intent methods** (`fillForm`, `submit`), not low-level driver calls.
- Keep **selectors centralized** in the class.
- Use **robust Playwright locators** (`getByRole`, `getByLabel`, `getByPlaceholder`).
- Return `Promise<void>` for actions; return data only when querying state.
- Make APIs **stable and human-readable**.

---

## Test Data Standards

### 1) Job Role Data Builders

```typescript
// bods/data/jobRoles.ts
export type JobRoleEditInput = {
  roleName: string;
  location: string;
  capabilityId: number;
  bandId: number;
  closingDate: string;
  description: string;
  responsibilities: string;
  sharepointUrl: string;
  numberOfOpenPositions: number;
};

export function buildJobRole(
  overrides: Partial<JobRoleEditInput> = {},
): JobRoleEditInput {
  return {
    roleName: 'Senior Backend Engineer',
    location: 'Dublin',
    capabilityId: 1,
    bandId: 2,
    closingDate: '2026-12-31',
    description: 'Own backend services and integrations.',
    responsibilities: 'Build APIs, review code, support delivery.',
    sharepointUrl: 'https://example.sharepoint.com/job-role',
    numberOfOpenPositions: 2,
    ...overrides,
  };
}

export function buildJobRoleUpdate(
  overrides: Partial<JobRoleEditInput> = {},
): Partial<JobRoleEditInput> {
  return {
    roleName: 'Principal Engineer',
    location: 'London',
    ...overrides,
  };
}
```

### 2) Data Table Parsers

```typescript
export function parseJobRoleTable(
  table: Array<{ [key: string]: string }>,
): Partial<JobRoleEditInput> {
  const result: any = {};
  
  table.forEach(row => {
    const [key, value] = Object.entries(row)[0];
    
    if (key === 'numberOfOpenPositions' || key === 'capabilityId' || key === 'bandId') {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  });
  
  return result;
}
```

### 3) Data Best Practices

- **Generate unique identifiers** (timestamps for emails, UUIDs where needed).
- **Allow field overrides** for scenario-specific customization.
- **Provide realistic defaults** that match domain constraints.
- **Keep parsers typed** and reusable across steps.

---

## Isolation and Determinism Rules

### 1) Independent Scenarios

Every scenario must:
- Be executable **in any order**.
- **Not depend** on data created by other scenarios.
- Create its own test data in `Background` or `Given` steps.
- Clean up in `After` hooks.

### 2) Backend Seeding

```typescript
// In World class or fixtures
async seedJobRoleViaAPI(data: JobRoleEditInput): Promise<any> {
  const response = await fetch(`${process.env.BASE_URL}/api/job-roles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

async deleteJobRoleViaAPI(id: number): Promise<void> {
  await fetch(`${process.env.BASE_URL}/api/job-roles/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${this.adminToken}`,
    },
  });
}
```

### 3) Avoid Brittle Tests

❌ **DON'T:**
```typescript
await page.waitFor(2000); // Hard-coded wait
```

✅ **DO:**
```typescript
await expect(page.locator('[role="alert"]')).toBeVisible(); // Assert state
```

---

## Assertions Standards

Use **observable, stable outcomes**:

```typescript
// ✅ Observable outcome
await expect(page).toHaveURL(/\/job-roles\/\d+$/);
await expect(banner).toContainText('Job role updated successfully');
await expect(field).toHaveValue('Principal Engineer');

// ❌ Implementation detail
expect(updateServiceCallCount).toBe(1);
```

---

## Backend Contract (US015)

### PATCH /api/job-roles/:id

**Auth:** `Authorization: Bearer <token>`

**Request body:**
```json
{
  "roleName": "string (optional)",
  "location": "string (optional)",
  "capabilityId": "number (optional)",
  "bandId": "number (optional)",
  "closingDate": "ISO 8601 date string (optional)",
  "description": "string (optional)",
  "responsibilities": "string (optional)",
  "sharepointUrl": "valid URL (optional)",
  "numberOfOpenPositions": "positive integer (optional)"
}
```

**Response:** Updated job role in detail shape

**Error responses:**
- `400 Bad Request` — validation failure
- `404 Not Found` — job role does not exist
- `403 Forbidden` — user is not admin

---

## Running Tests

### 1) Install Dependencies

```bash
npm install --save-dev \
  @cucumber/cucumber \
  @playwright/test \
  ts-node
```

### 2) Configure package.json

```json
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "test:bdd:smoke": "cucumber-js --tags @smoke"
  },
  "cucumber": {
    "default": {
      "require": ["bods/fixtures/bods.hooks.ts"],
      "require-module": ["ts-node/register"],
      "features": ["bods/features/**/*.feature"],
      "format": ["progress-bar", "html:cucumber-report.html"]
    }
  }
}
```

### 3) Run Tests

```bash
# All scenarios
npm run test:bdd

# Smoke tests only
npm run test:bdd:smoke

# Specific feature
npm run test:bdd -- bods/features/edit-job-role.feature

# Dry run
npm run test:bdd -- --dry-run
```

### 4) CI/CD Integration

In GitHub Actions or equivalent:

```yaml
- name: Run BDD Tests
  run: npm run test:bdd
  env:
    BASE_URL: http://localhost:3000
    ADMIN_EMAIL: admin@test.local
    ADMIN_PASSWORD: TestPassword123!
```

---

## Definition of Done for Edit Job Role BDD Feature

A BDD test is complete only when **all** are true:

- [ ] Feature file is readable by product/business stakeholders (no implementation details)
- [ ] Scenarios describe observable behavior, not click sequences
- [ ] Each step is mapped exactly once (no ambiguous regex patterns)
- [ ] Page object encapsulates all UI selectors and interactions
- [ ] Test data builders are typed and reusable
- [ ] Scenarios are independent and runnable in any order
- [ ] All created test data is cleaned up in `After` hooks
- [ ] Scenario passes repeatedly in local runs
- [ ] Tags (`@ui`, `@admin`, `@edit-job-role`) are applied correctly
- [ ] No hard-coded waits; all assertions wait for expected state
- [ ] Errors from backend (400, 403, 404) are tested
- [ ] Authorization (non-admin access) is tested
- [ ] Validation errors (empty fields, invalid URL) are tested

---

## Reusable Templates

### Feature Template

```gherkin
@ui @admin @edit-job-role
Feature: Admin edits job roles
  To maintain accurate job posting information
  As an admin
  I want to edit existing job role details

  Background:
    Given I am authenticated as an admin
    And a job role exists with the following details:
      | roleName              | Senior Backend Engineer |
      | location              | Dublin                  |

  @smoke
  Scenario: Admin successfully edits all fields
    When I navigate to the edit page
    And I update all fields with valid data
    And I submit the form
    Then I should see a success banner
```

### Steps Template

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BddWorld } from '../fixtures/bods.world';

Given('I am authenticated as an admin', async function (this: BddWorld) {
  // setup
});

When('I update all fields with valid data', async function (this: BddWorld) {
  // action
});

Then('I should see a success banner', async function (this: BddWorld) {
  // assertion
  await expect(this.page!.locator('[role="alert"]')).toBeVisible();
});
```

---

## Anti-Patterns to Avoid

❌ **DO NOT:**

1. Write scenarios that test multiple unrelated features.
2. Hard-code selectors in step files (use page objects).
3. Use global mutable state shared across scenarios.
4. Create UI fixtures in feature files (`.feature` files describe behavior only).
5. Write vague scenario names like "things work".
6. Repeat setup logic across multiple `Given` steps (use `Background`).
7. Assert on DOM internals (`data-testid` attributes); assert on semantics.

---

## Review Checklist

Before merging any BDD test:

- [ ] Feature file reads naturally to non-developers.
- [ ] Steps are concise and not duplicated.
- [ ] All UI interactions are in page objects.
- [ ] Test data is typed and builders are reusable.
- [ ] Happy path and error cases are both tested.
- [ ] Scenarios pass consistently in repeated runs.
- [ ] Tags are correct (`@ui`, `@admin`, `@edit-job-role`).
- [ ] No hard-coded waits or implementation details in `.feature` files.
- [ ] Authorization and validation scenarios included.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Scenarios not found | Check `cucumber` section in `package.json`; ensure feature paths are correct |
| Steps not mapped | Verify imports in step file; check step text matches regex exactly |
| Flaky assertions | Replace hard-coded waits with `expect(...).toBeVisible()` or similar |
| Authentication fails | Verify credentials in `.env`; check token is stored in World |
| Tests pass locally, fail in CI | Check environment variables (BASE_URL, credentials); ensure test data cleanup |

