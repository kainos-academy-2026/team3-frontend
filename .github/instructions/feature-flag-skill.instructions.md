---
applyTo: "src/**,tests/**,.github/skills/**"
description: "Feature flag implementation standards for new pages/routes and for creating reusable feature-flag skills."
---

# Feature Flag Standards For New Pages And Routes

## Purpose

Use this guide whenever a new page, route, or user flow should be controlled behind a feature flag.

Goals:
- Safe rollout without risky big-bang release
- Clear on/off behavior in controllers and routes
- Consistent testing for both flag states
- Fast removal when rollout is complete

## Existing Standards To Follow

- Follow naming, layering, and controller/service boundaries from frontend-standards.instructions.md.
- Keep auth and admin guard behavior consistent with existing route middleware patterns.
- Keep templates presentation-only; evaluate feature flags in controller/route layers, not in views.

## Core Rules

1. Define every flag in one central typed registry.
2. Default new flags to false unless product explicitly requires immediate-on.
3. Never read process.env directly in controllers, routes, services, or templates.
4. Use a shared feature-flag helper/middleware for checks.
5. Add tests for both enabled and disabled states.
6. Add expiry metadata so temporary flags are removed after rollout.

## Phase 1 - Central Flag Registry

Create or extend:
- src/config/featureFlags.ts

Required structure:
- FeatureFlagKey enum or const map
- Per-flag metadata:
  - key
  - envVar
  - defaultValue
  - owner
  - removeBy (target cleanup date)
  - description

Example flags:
- enableAdminRoleEdit
- enableApplicationsAdminPanel
- enableNewJobRolePage

## Phase 2 - Flag Resolver

Create or extend:
- src/services/featureFlagService.ts or src/config/featureFlags.ts helper exports

Rules:
- Resolve env values once through a typed helper
- Normalize truthy values consistently: true, 1, yes, on
- Return boolean only
- Keep pure and easy to unit test

## Phase 3 - Route Gating

For new flagged routes in src/routes:
- Apply requireAuth or requireAdmin first when needed
- Then apply feature-flag middleware
- Return 404 for disabled route by default to avoid exposing hidden features
- Use 403 only when feature is on but user is unauthorized

Recommended middleware order:
1. requireAuth
2. requireAdmin (if admin only)
3. requireFeatureFlag(flagKey)
4. controller handler

## Phase 4 - Controller Gating

For existing routes with partially flagged UI:
- Evaluate the flag in controller
- Build explicit render model fields such as:
  - isNewFeatureEnabled
- Render legacy content when disabled
- Do not place process.env checks in Nunjucks templates

## Phase 5 - View Rules

In src/views/pages:
- Keep views passive
- Use boolean values passed from controller
- No inline scripts/styles for flag logic
- Avoid dead branches that permanently diverge old/new UI over long periods

## Phase 6 - Skill Authoring Rules

When creating a feature-flag skill under .github/skills:
- Skill must require:
  - central registry update
  - middleware/controller checks
  - tests for on/off states
  - cleanup plan with removeBy
- Skill must reject ad-hoc env checks scattered in code
- Skill output should include:
  - changed files list
  - rollout plan
  - rollback plan
  - cleanup task

## Phase 7 - Testing Requirements

Add/update tests in tests/** for each flagged feature:

1. Config/service tests
- resolves default false when env missing
- resolves true for supported truthy values
- rejects/handles invalid values safely

2. Route tests
- flag off returns 404 (or agreed disabled behavior)
- flag on delegates to controller
- auth/admin behavior still enforced

3. Controller tests
- enabled model path
- disabled model path
- no leakage of internal flag config to end users

4. Optional BDD tests
- tagged scenarios for flag-enabled and flag-disabled flows

## Phase 8 - Rollout And Cleanup

Every new flag must include:
- owner
- rollout checkpoint
- removeBy date
- explicit cleanup issue reference

After full rollout:
1. Remove conditional branches
2. Remove flag entry and env usage
3. Remove obsolete tests for disabled path
4. Keep only final intended behavior tests

## Anti-Patterns

Do not:
- read process.env in routes/controllers/templates
- add one-off helper logic per feature
- leave temporary flags with no cleanup date
- skip tests for disabled state
- use feature flags as permanent authorization controls

## Files To Change (Typical)

- src/config/featureFlags.ts
- src/middleware/featureFlagMiddleware.ts
- src/routes/*Routes.ts
- src/controllers/*Controller.ts
- src/views/pages/*.njk
- tests/config/*.test.ts
- tests/routes/*.test.ts
- tests/controllers/*.test.ts
- .github/skills/feature-flag-builder/SKILL.md

## Pre-PR Checklist

1. Format, lint, build, and test all pass.
2. Flag off path verified manually.
3. Flag on path verified manually.
4. Auth/admin behavior unchanged.
5. Cleanup metadata included for each new flag.
6. No direct process.env flag reads outside central config.
