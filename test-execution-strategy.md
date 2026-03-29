# Open-WebUI WCAG Phase 1 Test Execution Strategy

## Test Environment Status (2026-03-28 21:16 UTC)

### Repository
- Path: `/var/home/pestilence/repos/personal/open-webui`
- Branch: `feat/wcag-phase1-accessibility`
- Test frameworks available: pytest (8.4.2), vitest (1.6.1), playwright (1.58.2), axe-core/playwright (4.11.1)

### Current Blockers
1. **Backend Tests**: Import path errors - Agent 1 is fixing
   - Error: `ModuleNotFoundError: No module named 'test.util'`
   - Affected: `test_auths.py`, `test_models.py`, `test_users.py`, etc.

2. **Dev Server**: Not currently running (required for E2E tests)
   - Expected URL: `http://localhost:5173`

## Test Infrastructure Overview

### 1. Backend Tests (Python/pytest)
**Status**: BLOCKED - awaiting Agent 1 fixes
**Location**: `backend/open_webui/test/`
**Test files**:
- `apps/webui/routers/test_auths.py`
- `apps/webui/routers/test_models.py`
- `apps/webui/routers/test_users.py`
- `apps/webui/storage/test_provider.py`
- `util/test_redis.py`

**Planned command**:
```bash
python -m pytest backend/open_webui/test/ -v --tb=long --cov=backend/open_webui --cov-report=term-missing --cov-report=html:coverage-backend
```

### 2. Frontend Tests (Vitest)
**Status**: NO TESTS EXIST
**Configuration**: Uses vitest 1.6.1 via `npm run test:frontend`
**Current behavior**: `--passWithNoTests` flag allows zero tests

**Recommendation**: Create unit tests for:
- Color utility functions (contrast calculation)
- Accessibility helper functions
- Component rendering (if using testing-library)

### 3. E2E Accessibility Tests (Playwright + axe-core)
**Status**: READY - awaiting dev server
**Location**: `validate-p0-2.spec.ts`
**Configuration**: `playwright.config.ts`

**Test coverage**:
- ✅ Color contrast validation (WCAG 2.1 AA 4.5:1)
- ✅ Critical/serious violation detection
- ✅ Full page screenshot capture
- ✅ Detailed JSON report generation

**Command**:
```bash
npx playwright test validate-p0-2.spec.ts --reporter=list
```

**Outputs**:
- `p0-2-validation-report.json` - Detailed axe-core results
- `p0-2-validation-screenshot.png` - Visual evidence

### 4. Cypress Tests
**Status**: AVAILABLE (not used in current validation)
**Configuration**: `cypress.config.ts` - baseUrl: `http://localhost:8080`

## Execution Plan

### Phase 1: Environment Setup
- [ ] Wait for Agent 1 to fix backend test imports
- [ ] Start dev server: `npm run dev` (will bind to `http://localhost:5173`)
- [ ] Verify server health: `curl http://localhost:5173`

### Phase 2: Backend Tests
- [ ] Run full backend test suite with coverage
- [ ] Generate coverage report (HTML + terminal)
- [ ] Document any failures or gaps

### Phase 3: Frontend Tests
- [ ] Run vitest (currently passes with no tests)
- [ ] Document need for unit test coverage

### Phase 4: E2E Accessibility Validation
- [ ] Run Playwright P0-2 validation suite
- [ ] Capture axe-core scan results
- [ ] Verify zero color-contrast violations
- [ ] Generate full-page screenshot evidence
- [ ] Save detailed JSON report

### Phase 5: Analysis & Reporting
- [ ] Aggregate all test results
- [ ] Calculate total coverage percentages
- [ ] Identify untested code paths
- [ ] Generate prioritized improvement recommendations
- [ ] Create final test report

## Test Metrics to Capture

### Backend
- Total tests: pass/fail/skip/error
- Execution time
- Coverage: overall, per module, per file
- Functions/lines with 0% coverage

### Frontend
- Currently: 0 tests (need to create)
- Recommended: Component tests, utility tests

### Accessibility (Playwright + axe-core)
- Total violations by severity (critical/serious/moderate/minor)
- Color contrast violations: MUST be 0
- WCAG 2.1 AA compliance: MUST pass
- Screenshot evidence
- Detailed node-level violation data

## Success Criteria

1. **Backend tests**: All pass, >80% coverage preferred
2. **Frontend tests**: Suite exists (currently missing)
3. **P0-2 Accessibility**: Zero color-contrast violations
4. **WCAG 2.1 AA**: Zero critical/serious violations
5. **Documentation**: Comprehensive report with evidence

## Next Actions

1. Monitor Agent 1's progress on backend test fixes
2. Once backend tests pass, start dev server
3. Execute full test suite in order
4. Generate comprehensive test report
5. Update task #38 with results
