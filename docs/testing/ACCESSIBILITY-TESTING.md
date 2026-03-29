# Accessibility Testing

This document describes the automated accessibility testing infrastructure for Open-WebUI. The test suite validates WCAG 2.1 AA compliance using Playwright and axe-core.

## Overview

The accessibility test suite provides:
- Automated regression testing on every PR
- Comprehensive coverage of all major UI components
- Multi-viewport and color scheme testing
- Detailed violation reports with actionable fixes
- CI/CD integration that fails builds on new violations

## Test Suite Structure

```
tests/e2e/accessibility/
├── chat-interface.spec.ts      # Main chat UI accessibility
├── settings.spec.ts            # Settings page forms and controls
├── sidebar.spec.ts             # Navigation and sidebar
├── model-selection.spec.ts     # Model selector dropdown
└── regression.spec.ts          # Fast comprehensive scan
```

## Running Tests Locally

### Prerequisites

```bash
# Install dependencies
npm ci --force

# Install Playwright browsers
npx playwright install --with-deps chromium
```

### Run All Accessibility Tests

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal
npx playwright test tests/e2e/accessibility
```

### Run Specific Test Suite

```bash
# Test only chat interface
npx playwright test tests/e2e/accessibility/chat-interface.spec.ts

# Test with UI mode (interactive)
npx playwright test tests/e2e/accessibility --ui

# Run only regression tests (fastest)
npx playwright test tests/e2e/accessibility/regression.spec.ts
```

### Generate HTML Report

```bash
npx playwright test tests/e2e/accessibility --reporter=html
npx playwright show-report
```

## Test Coverage

### Chat Interface Tests
- Critical accessibility violations scan
- Keyboard navigation validation
- ARIA label verification
- Color contrast (light/dark modes)
- Focus management
- Mobile/tablet responsiveness

### Settings Page Tests
- Form control accessibility
- Label associations
- Keyboard navigation
- ARIA attributes on interactive elements
- Color contrast in forms

### Sidebar Navigation Tests
- Navigation landmark structure
- Keyboard accessibility
- ARIA attributes for nav items
- Color contrast
- Collapsed/expanded state handling
- Focus management on toggle

### Model Selection Tests
- Dropdown/select accessibility
- Keyboard interaction (Enter, Escape, arrows)
- ARIA attributes on combobox/select
- Color contrast
- Focus trap prevention

### Regression Tests
- Homepage critical violations
- Light/dark mode compatibility
- Mobile/tablet/desktop viewports
- Comprehensive summary report generation
- Keyboard navigation violations
- ARIA violations
- Color contrast violations

## Understanding Test Results

### Severity Levels

Tests fail CI only on **critical** and **serious** violations:

| Severity | Description | CI Behavior |
|----------|-------------|-------------|
| **Critical** | Severe impact on users with disabilities | Fails CI |
| **Serious** | Significant barrier to accessibility | Fails CI |
| **Moderate** | Noticeable issue but not blocking | Warning only |
| **Minor** | Small improvement opportunity | Warning only |

### Common Violations and Fixes

#### 1. Color Contrast (`color-contrast`)
**Problem:** Text color doesn't meet WCAG AA 4.5:1 ratio.

**Fix:**
```svelte
<!-- Before -->
<span class="text-gray-400">Low contrast text</span>

<!-- After -->
<span class="text-gray-700 dark:text-gray-300">Sufficient contrast</span>
```

#### 2. Button Name (`button-name`)
**Problem:** Button lacks accessible name.

**Fix:**
```svelte
<!-- Before -->
<button><Icon /></button>

<!-- After -->
<button aria-label="Close dialog"><Icon /></button>
```

#### 3. Form Labels (`label`)
**Problem:** Input field missing associated label.

**Fix:**
```svelte
<!-- Before -->
<input type="text" />

<!-- After -->
<label for="username">Username</label>
<input id="username" type="text" />

<!-- Or using aria-label -->
<input type="text" aria-label="Username" />
```

#### 4. Keyboard Navigation (`keyboard`, `tabindex`)
**Problem:** Interactive element not keyboard accessible.

**Fix:**
```svelte
<!-- Before -->
<div on:click={handleClick}>Click me</div>

<!-- After -->
<button on:click={handleClick}>Click me</button>

<!-- Or if div required -->
<div role="button" tabindex="0" on:click={handleClick} on:keydown={handleKeyPress}>
  Click me
</div>
```

#### 5. ARIA Attributes (`aria-*` violations)
**Problem:** Invalid or missing ARIA attributes.

**Fix:**
```svelte
<!-- Before -->
<div role="dialog">
  <h2>Dialog title</h2>
  ...
</div>

<!-- After -->
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Dialog title</h2>
  ...
</div>
```

## CI/CD Integration

### GitHub Actions Workflow

The accessibility test suite runs automatically on:
- Every pull request to `main` or `dev`
- Direct pushes to `main` or `dev`
- Manual workflow dispatch

**Workflow file:** `.github/workflows/accessibility-tests.yml`

### What the CI Does

1. Builds the application
2. Starts dev server
3. Runs all accessibility tests
4. Generates detailed reports
5. Posts summary to PR comments
6. Uploads artifacts (reports, screenshots, traces)
7. **Fails the build if critical/serious violations found**

### Viewing CI Results

#### In Pull Request
- Check the PR comment for accessibility summary
- Click "Details" next to the failed check
- View the GitHub Actions run

#### Artifacts
Download from the GitHub Actions run page:
- `accessibility-reports/` - JSON reports with full details
- `summary.md` - Human-readable summary
- `*.png` - Screenshots of tested pages
- `html-report/` - Interactive Playwright report

### Interpreting Reports

#### JSON Report Structure
```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Elements must meet minimum contrast",
      "help": "Ensure color contrast meets WCAG AA",
      "helpUrl": "https://dequeuniversity.com/rules/axe/4.x/color-contrast",
      "nodes": [
        {
          "html": "<span class=\"text-gray-400\">Text</span>",
          "target": ["#app > div > span"],
          "failureSummary": "Fix any: Element has insufficient contrast"
        }
      ]
    }
  ]
}
```

#### Summary Report
Generated in `test-results/accessibility/{timestamp}/summary.md`:
- Total violations by severity
- Passed checks count
- Top 10 violation types
- Links to detailed reports

## Best Practices

### 1. Run Tests Before Pushing
```bash
npm run dev &
npx playwright test tests/e2e/accessibility/regression.spec.ts
```

### 2. Fix Violations Immediately
Don't accumulate accessibility debt. Fix violations as you build features.

### 3. Test Color Schemes
Always test both light and dark modes:
```bash
# Emulate in browser DevTools or use tests
await page.emulateMedia({ colorScheme: 'dark' });
```

### 4. Test Keyboard Navigation
Ensure all interactive elements are reachable via Tab:
```bash
# Manual test: navigate entire UI using only keyboard
# Tab, Shift+Tab, Enter, Escape, Arrow keys
```

### 5. Use Semantic HTML
```svelte
<!-- Good -->
<button>Click me</button>
<nav><a href="/page">Link</a></nav>

<!-- Avoid -->
<div onclick="...">Click me</div>
<div><span>Link</span></div>
```

### 6. Add ARIA When Needed
```svelte
<!-- Modal dialog -->
<div role="dialog" aria-modal="true" aria-labelledby="title">
  <h2 id="title">Dialog Title</h2>
  ...
</div>

<!-- Loading spinner -->
<div role="status" aria-live="polite" aria-label="Loading...">
  <Spinner />
</div>
```

## Writing New Accessibility Tests

### Test Template
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Component Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/component');
    await page.waitForLoadState('networkidle');
  });

  test('should have no critical violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
  });
});
```

### Test Configuration

**Playwright config:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
```

### Targeting Specific Rules
```typescript
// Test only color contrast
const results = await new AxeBuilder({ page })
  .withTags(['wcag2aa'])
  .disableRules(['aria-hidden-focus'])
  .analyze();

// Test only ARIA attributes
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a'])
  .disableRules(['color-contrast'])
  .analyze();
```

## Troubleshooting

### Tests Timeout
**Cause:** Dev server not ready or page slow to load.

**Fix:**
```typescript
// Increase timeout in test
test.setTimeout(30000); // 30 seconds

// Wait for specific element
await page.waitForSelector('[data-testid="app-loaded"]');
```

### False Positives
**Cause:** axe-core can't determine contrast on dynamic content.

**Fix:**
```typescript
// Disable specific rules for specific tests
const results = await new AxeBuilder({ page })
  .disableRules(['color-contrast']) // Only if genuinely not applicable
  .analyze();
```

### Server Not Starting in CI
**Cause:** Port conflict or build failure.

**Fix:**
```yaml
# In .github/workflows/accessibility-tests.yml
- name: Start Server
  run: |
    npm run dev -- --port 5173 &
    timeout 60 bash -c 'until curl -s http://localhost:5173; do sleep 2; done'
```

### High Memory Usage
**Cause:** Too many parallel tests or large page scans.

**Fix:**
```typescript
// In playwright.config.ts
export default defineConfig({
  workers: 1, // Sequential execution
  fullyParallel: false
});
```

## Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Tools
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Deque University
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Playwright Documentation
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Playwright Testing](https://playwright.dev/docs/intro)

## Performance Targets

The test suite is designed to execute quickly:

| Test Suite | Target Time | Actual Time |
|------------|-------------|-------------|
| Regression | <30s | ~25s |
| Chat Interface | <45s | ~40s |
| Settings | <30s | ~25s |
| Sidebar | <30s | ~25s |
| Model Selection | <30s | ~25s |
| **Full Suite** | **<2min** | **~1m 50s** |

## Maintenance

### Updating axe-core
```bash
npm update @axe-core/playwright
```

### Adding New Pages
1. Create test file in `tests/e2e/accessibility/`
2. Use existing tests as templates
3. Focus on critical/serious violations
4. Ensure tests run in <30 seconds

### Excluding Known Issues
If a violation is known and tracked:
```typescript
// Document why this is excluded
const results = await new AxeBuilder({ page })
  .exclude('#legacy-component') // Tracked in issue #123
  .analyze();
```

## Support

For questions or issues with accessibility testing:
1. Check this documentation
2. Review existing test files for examples
3. Run tests locally to debug
4. Check axe-core documentation
5. Open an issue with test output and screenshots
