# BDD Test Standards (Cucumber + Playwright + TypeScript)
 
Use this file as the single source of truth for creating and maintaining BDD tests in this project.
 
## Goal
 
Write behavior-focused tests that are:
 
- readable by non-developers,
- deterministic in CI,
- independent from each other,
- easy to maintain.
 
## Canonical Structure
 
Keep all BDD assets under `bods/`:
 
```text
bods/
  data/         # typed builders and table parsers
  features/     # .feature files written in Gherkin
  fixtures/     # shared Cucumber World + hooks
  pages/        # page objects for UI interactions
  steps/        # step definitions (Given/When/Then)
```
 
## Naming Standards
 
- Feature files: kebab-case, action oriented, for example `add-user.feature`.
- Step files: match the feature name, for example `add-user.steps.ts`.
- Page objects: PascalCase with `Page` suffix, for example `CreateUserPage.ts`.
- Data helpers: domain noun pluralized when possible, for example `users.ts`.
- Scenario titles: describe observable behavior, not implementation details.
 
## Gherkin Authoring Standards
 
1. Start with a business-level feature description.
2. Use `Background` only for setup common to every scenario.
3. Group rules using `Rule` sections when they represent business constraints.
4. Keep scenarios independent and runnable in any order.
5. Prefer realistic data values.
6. Avoid UI internals in `.feature` files (no selectors, IDs, or click sequences).
7. Use tags intentionally:
   - `@smoke` for critical happy paths.
   - `@ui`, `@api`, or other layer tags for slicing execution.
 
### Recommended Scenario Shape
 
- `Given`: preconditions or existing state
- `When`: one action
- `Then`: one core expected outcome
- `And`: only to extend the same phase
 
## Step Definition Standards
 
1. Keep step bodies short and explicit.
2. Put browser details in page objects, not in step definitions.
3. Keep assertions in `Then` steps unless a setup assertion is needed for safety.
4. Reuse typed helpers for data mapping and generation.
5. Do not share mutable global state between scenarios.
 
### Step Definition Quality Rules
 
- Use typed world context: `this: BddWorld`.
- Use non-null assertions only when guarded by prior setup.
- Avoid duplicate step text with ambiguous regex patterns.
- Keep side effects obvious (API seeding, cleanup, navigation).
 
## World + Hooks Standards
 
Your World implementation must:
 
- create a fresh browser context and request context per scenario,
- initialize nullable scenario state safely,
- clean up created test data in `After`,
- close context and request objects after each scenario,
- launch and close the browser once per suite (`BeforeAll` / `AfterAll`).
 
### Default Environment
 
- Base URL should default to `http://127.0.0.1:3000`.
 
## Page Object Standards
 
1. Expose user-intent methods, not low-level driver details.
2. Keep selectors centralized in the page object.
3. Prefer robust Playwright locators (`getByRole`, `getByLabel`, etc.).
4. Return `Promise<void>` for action methods unless data is returned.
5. Keep page object APIs stable and human-readable.
 
## Test Data Standards
 
- Use builder functions for valid defaults.
- Allow field overrides for scenario-specific values.
- Generate unique identifiers (for example timestamp-based emails) to avoid collisions.
- Keep parser helpers for Cucumber tables typed and reusable.
 
## Isolation and Determinism Rules
 
- Every scenario must be independently executable.
- Seed/reset backend state in `Background` or setup steps where needed.
- Do not depend on execution order.
- Always clean up entities created during scenarios.
 
## Assertions Standards
 
- Assert observable outcomes only (URL, visible text, API response, state changes).
- Use exact assertions where stable and meaningful.
- Avoid brittle timing assumptions.
- Prefer semantic assertions over implementation assertions.
 
## Command Standards
 
Primary BDD command:
 
```bash
npm run test:bdd
```
 
Keep `package.json` aligned with this shape:
 
```json
"test:bdd": "cucumber-js --require-module ts-node/register --require bods/fixtures/bods.fixture.ts --require bods/steps/**/*.ts bods/features/**/*.feature"
```
 
## Definition of Done for Any New BDD Test
 
A new test is complete only when all are true:
 
1. Feature file is readable by product/business stakeholders.
2. Steps are mapped once (no duplicate ambiguous matches).
3. Page object encapsulates UI actions/selectors.
4. Data setup/cleanup is deterministic.
5. Scenario passes repeatedly in local runs.
6. Scenario can run alone and in full suite.
7. Tags are applied correctly for filtering.
 
## Reusable Templates
 
### 1) Feature Template
 
```gherkin
@ui @bdd @<domain>
Feature: <business capability>
  To <business outcome>
  As a <user role>
  I want to <user intent>
 
  Background:
    Given <shared precondition>
 
  Rule: <business rule>
 
    @smoke
    Scenario: <observable behavior>
      Given <specific precondition>
      When <single action>
      Then <expected result>
```
 
### 2) Steps Template
 
```ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BddWorld } from '../fixtures/bods.fixture';
 
Given('<precondition>', async function (this: BddWorld) {
  // setup
});
 
When('<action>', async function (this: BddWorld) {
  // execute user action
});
 
Then('<outcome>', async function (this: BddWorld) {
  // assertion
  await expect(this.page!).toHaveURL(/expected/);
});
```
 
### 3) Page Object Template
 
```ts
import { type Locator, type Page } from '@playwright/test';
 
export class ExamplePage {
  readonly page: Page;
  readonly submitButton: Locator;
 
  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }
 
  async goto(): Promise<void> {
    await this.page.goto('/example');
  }
 
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
```
 
### 4) Data Builder Template
 
```ts
export type ExampleInput = {
  fieldA: string;
  fieldB: string;
};
 
export function buildExample(overrides: Partial<ExampleInput> = {}): ExampleInput {
  return {
    fieldA: 'default-a',
    fieldB: 'default-b',
    ...overrides,
  };
}
```
 
## Anti-Patterns to Avoid
 
- Writing scenarios that test multiple unrelated behaviors.
- Hard-coding waits instead of asserting expected state.
- Repeating selectors across step files.
- Coupling one scenario to data created by another.
- Using vague scenario names like "works correctly".
 
## Review Checklist (Use Before Merging)
 
- Does the feature describe user/business behavior clearly?
- Are steps concise and free from duplicated intent?
- Is all UI interaction abstracted into page objects?
- Is test data unique and cleanup reliable?
- Can the scenario pass consistently in repeated runs?
- Are tags and naming aligned with these standards?