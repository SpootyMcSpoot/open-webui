# Accessibility Test Suite

Automated WCAG 2.1 AA compliance testing using Playwright and axe-core.

## Quick Start

```bash
# Install dependencies
npm ci --force
npx playwright install chromium

# Start dev server
npm run dev

# Run all accessibility tests
npx playwright test tests/e2e/accessibility

# Run specific suite
npx playwright test tests/e2e/accessibility/regression.spec.ts

# Interactive UI mode
npx playwright test tests/e2e/accessibility --ui

# Generate HTML report
npx playwright test tests/e2e/accessibility --reporter=html
npx playwright show-report
```

## Test Suites

- **regression.spec.ts** - Fast comprehensive scan (7 tests, ~33s)
- **chat-interface.spec.ts** - Main chat UI (8 tests, ~27s)
- **settings.spec.ts** - Settings page (6 tests, ~19s)
- **sidebar.spec.ts** - Navigation sidebar (7 tests, ~23s)
- **model-selection.spec.ts** - Model selector (6 tests, ~20s)

**Total:** 34 tests in ~1m 47s

## What's Tested

- WCAG 2.1 AA compliance (critical/serious violations)
- Keyboard navigation
- ARIA attributes and semantic HTML
- Color contrast (4.5:1 ratio minimum)
- Light/dark mode compatibility
- Responsive design (mobile/tablet/desktop)
- Focus management

## CI/CD Integration

Tests run automatically on every PR via `.github/workflows/accessibility-tests.yml`:
- Uses `stax-browser` runner
- Fails build on critical/serious violations
- Generates detailed reports
- Posts summary to PR comments
- Uploads artifacts (reports, screenshots)

## Documentation

See `/var/home/pestilence/repos/personal/open-webui/docs/testing/ACCESSIBILITY-TESTING.md` for:
- Detailed test descriptions
- How to fix common violations
- Writing new tests
- Understanding axe-core reports
- Troubleshooting guide

## Generated Reports

Test execution creates:
- `test-results/accessibility/{timestamp}/summary.md` - Human-readable summary
- `test-results/accessibility/{timestamp}/*.json` - Full axe-core reports
- `test-results/accessibility/{timestamp}/*.png` - Screenshots
- `test-results/accessibility/html-report/` - Interactive Playwright report

## Current Status

✅ **Zero violations** on current codebase
✅ All 34 tests passing
✅ Execution time: 1m 47s (target: <2min)
