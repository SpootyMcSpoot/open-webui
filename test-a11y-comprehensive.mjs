/**
 * Comprehensive Accessibility Test Runner
 *
 * Tests all key workflows and accessibility features added in P0-3:
 * - Form labels and ARIA attributes
 * - Keyboard navigation
 * - Screen reader support
 * - Color contrast
 * - Responsive behavior
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const reportDir = path.join(process.cwd(), 'test-results', 'accessibility', 'comprehensive-' + timestamp);

// Ensure report directory exists - do this during test setup
function ensureReportDir() {
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
}

// Test results collector
const testResults = {
  timestamp: new Date().toISOString(),
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function runAxe(page, tags = ['wcag2a', 'wcag2aa', 'wcag21aa']) {
  return await page.evaluate((tagsList) => {
    return new Promise((resolve) => {
      // @ts-ignore
      axe.run(
        {
          runOnly: {
            type: 'tag',
            values: tagsList
          }
        },
        (err, results) => {
          if (err) throw err;
          resolve(results);
        }
      );
    });
  }, tags);
}

async function testHomepage(page) {
  console.log('\n📄 HOMEPAGE ACCESSIBILITY');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Inject axe-core
  await page.addScriptTag({
    path: './node_modules/axe-core/axe.min.js'
  });

  const results = await runAxe(page);
  const criticalViolations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  logTest(
    'Homepage has no critical violations',
    criticalViolations.length === 0,
    criticalViolations.length > 0 ? `Found ${criticalViolations.length} violations` : ''
  );

  // Save report
  fs.writeFileSync(
    path.join(reportDir, 'homepage-report.json'),
    JSON.stringify(results, null, 2)
  );

  await page.screenshot({
    path: path.join(reportDir, 'homepage.png'),
    fullPage: true
  });

  return results;
}

async function testKeyboardNavigation(page) {
  console.log('\n⌨️  KEYBOARD NAVIGATION');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Test Tab key navigation
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);

  let focused = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el?.tagName,
      role: el?.getAttribute('role'),
      ariaLabel: el?.getAttribute('aria-label'),
      visible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
    };
  });

  logTest(
    'Tab key moves focus to a visible element',
    focused.tag && focused.visible,
    focused.tag ? `Focused: ${focused.tag} ${focused.ariaLabel || focused.role || ''}` : 'No focus'
  );

  // Test Escape key (should close modals)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  // Test arrow key navigation on lists/menus
  const interactiveElements = await page.locator(
    'button:visible, a:visible, input:visible, textarea:visible, [role="button"]:visible, [role="link"]:visible'
  );
  const count = await interactiveElements.count();

  logTest(
    'Page has keyboard-accessible interactive elements',
    count > 0,
    `Found ${count} interactive elements`
  );

  // Test focus visible styles
  const hasFocusStyles = await page.evaluate(() => {
    const testEl = document.querySelector('button, a, input, textarea');
    if (!testEl) return false;

    testEl.focus();
    const styles = window.getComputedStyle(testEl);
    // Check if there's any outline or ring styling
    return styles.outline !== 'none' ||
           styles.outlineWidth !== '0px' ||
           styles.boxShadow !== 'none';
  });

  logTest(
    'Focusable elements have visible focus indicators',
    hasFocusStyles,
    hasFocusStyles ? 'Focus styles present' : 'Warning: Focus styles may be missing'
  );
}

async function testFormAccessibility(page) {
  console.log('\n📝 FORM ACCESSIBILITY');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Inject axe-core if not already present
  await page.addScriptTag({
    path: './node_modules/axe-core/axe.min.js'
  }).catch(() => {});

  // Check for form elements
  const formElements = await page.locator('input, textarea, select, [role="textbox"], [role="combobox"]');
  const formCount = await formElements.count();

  if (formCount > 0) {
    logTest(
      'Page contains form elements',
      true,
      `Found ${formCount} form controls`
    );

    // Check each form element for labels
    let labeledCount = 0;
    for (let i = 0; i < Math.min(formCount, 10); i++) {
      const element = formElements.nth(i);
      const hasLabel = await element.evaluate((el) => {
        // Check for explicit label
        if (el.id) {
          const label = document.querySelector(`label[for="${el.id}"]`);
          if (label && label.textContent.trim()) return true;
        }
        // Check for aria-label
        if (el.getAttribute('aria-label')) return true;
        // Check for aria-labelledby
        if (el.getAttribute('aria-labelledby')) return true;
        // Check for placeholder (not ideal but acceptable)
        if (el.getAttribute('placeholder')) return true;
        // Check for parent label
        const parentLabel = el.closest('label');
        if (parentLabel && parentLabel.textContent.trim()) return true;

        return false;
      });

      if (hasLabel) labeledCount++;
    }

    const sampledCount = Math.min(formCount, 10);
    logTest(
      'Form controls have accessible labels',
      labeledCount === sampledCount,
      `${labeledCount}/${sampledCount} sampled form controls have labels`
    );
  } else {
    console.log('  ℹ️  No form elements found on homepage');
  }

  // Run axe specifically for label violations
  const results = await runAxe(page);
  const labelViolations = results.violations.filter(
    (v) => v.id === 'label' || v.id === 'label-title-only' || v.id.includes('form-field')
  );

  logTest(
    'No form label violations (axe-core)',
    labelViolations.length === 0,
    labelViolations.length > 0 ? `Found ${labelViolations.length} label violations` : ''
  );
}

async function testAriaAttributes(page) {
  console.log('\n🎯 ARIA ATTRIBUTES');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Inject axe-core if not already present
  await page.addScriptTag({
    path: './node_modules/axe-core/axe.min.js'
  }).catch(() => {});

  // Check buttons for aria-label
  const buttons = await page.locator('button:visible');
  const buttonCount = await buttons.count();

  let labeledButtons = 0;
  for (let i = 0; i < Math.min(buttonCount, 20); i++) {
    const hasLabel = await buttons.nth(i).evaluate((btn) => {
      return !!(
        btn.textContent?.trim() ||
        btn.getAttribute('aria-label') ||
        btn.getAttribute('aria-labelledby') ||
        btn.getAttribute('title')
      );
    });
    if (hasLabel) labeledButtons++;
  }

  const sampledButtons = Math.min(buttonCount, 20);
  logTest(
    'Buttons have accessible names',
    labeledButtons === sampledButtons,
    `${labeledButtons}/${sampledButtons} sampled buttons have labels`
  );

  // Run axe for ARIA violations
  const results = await runAxe(page);
  const ariaViolations = results.violations.filter(
    (v) => v.id.includes('aria') || v.id === 'button-name' || v.id === 'link-name'
  );

  logTest(
    'No ARIA violations (axe-core)',
    ariaViolations.length === 0,
    ariaViolations.length > 0 ? `Found ${ariaViolations.length} ARIA violations` : ''
  );
}

async function testColorContrast(page) {
  console.log('\n🎨 COLOR CONTRAST');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Inject axe-core if not already present
  await page.addScriptTag({
    path: './node_modules/axe-core/axe.min.js'
  }).catch(() => {});

  // Test light mode
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(500);

  const lightResults = await runAxe(page, ['wcag2aa']);
  const lightContrast = lightResults.violations.filter((v) => v.id === 'color-contrast');

  logTest(
    'Light mode meets WCAG AA contrast',
    lightContrast.length === 0,
    lightContrast.length > 0 ? `Found ${lightContrast[0].nodes.length} contrast violations` : ''
  );

  // Test dark mode
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(500);

  const darkResults = await runAxe(page, ['wcag2aa']);
  const darkContrast = darkResults.violations.filter((v) => v.id === 'color-contrast');

  logTest(
    'Dark mode meets WCAG AA contrast',
    darkContrast.length === 0,
    darkContrast.length > 0 ? `Found ${darkContrast[0].nodes.length} contrast violations` : ''
  );
}

async function testResponsive(page) {
  console.log('\n📱 RESPONSIVE ACCESSIBILITY');
  console.log('='.repeat(60));

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(1000);

    // Inject axe-core
    await page.addScriptTag({
      path: './node_modules/axe-core/axe.min.js'
    }).catch(() => {});

    const results = await runAxe(page);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    logTest(
      `${viewport.name} (${viewport.width}x${viewport.height}) accessible`,
      criticalViolations.length === 0,
      criticalViolations.length > 0 ? `${criticalViolations.length} violations` : ''
    );

    await page.screenshot({
      path: path.join(reportDir, `${viewport.name.toLowerCase()}.png`),
      fullPage: true
    });
  }
}

async function testScreenReaderSupport(page) {
  console.log('\n🔊 SCREEN READER SUPPORT');
  console.log('='.repeat(60));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check for ARIA live regions
  const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]');
  const liveCount = await liveRegions.count();

  logTest(
    'ARIA live regions present for dynamic content',
    liveCount > 0,
    `Found ${liveCount} live regions`
  );

  // Check for skip links
  const skipLinks = await page.locator('a[href*="#main"], a[href*="#content"]');
  const skipCount = await skipLinks.count();

  logTest(
    'Skip-to-content links present',
    skipCount > 0,
    `Found ${skipCount} skip links`
  );

  // Check for proper heading structure
  const headings = await page.evaluate(() => {
    const h1 = document.querySelectorAll('h1').length;
    const h2 = document.querySelectorAll('h2').length;
    const h3 = document.querySelectorAll('h3').length;
    return { h1, h2, h3, total: h1 + h2 + h3 };
  });

  logTest(
    'Page has semantic heading structure',
    headings.total > 0,
    `H1: ${headings.h1}, H2: ${headings.h2}, H3: ${headings.h3}`
  );

  // Check for alt text on images
  const images = await page.locator('img');
  const imageCount = await images.count();
  let imagesWithAlt = 0;

  for (let i = 0; i < imageCount; i++) {
    const hasAlt = await images.nth(i).evaluate((img) => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      return alt !== null || role === 'presentation' || role === 'none';
    });
    if (hasAlt) imagesWithAlt++;
  }

  logTest(
    'Images have alt text or proper role',
    imagesWithAlt === imageCount,
    `${imagesWithAlt}/${imageCount} images properly labeled`
  );
}

async function runAllTests() {
  // Ensure report directory exists before running tests
  ensureReportDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 COMPREHENSIVE ACCESSIBILITY TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`URL: http://localhost:5173`);

  try {
    await testHomepage(page);
    await testKeyboardNavigation(page);
    await testFormAccessibility(page);
    await testAriaAttributes(page);
    await testColorContrast(page);
    await testResponsive(page);
    await testScreenReaderSupport(page);

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📁 Reports: ${reportDir}`);

    // Save results
    fs.writeFileSync(
      path.join(reportDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );

    // Generate markdown report
    let markdown = `# Accessibility Test Results\n\n`;
    markdown += `**Date:** ${testResults.timestamp}\n`;
    markdown += `**Passed:** ${testResults.passed}\n`;
    markdown += `**Failed:** ${testResults.failed}\n\n`;
    markdown += `## Test Details\n\n`;

    testResults.tests.forEach((test) => {
      const icon = test.passed ? '✅' : '❌';
      markdown += `${icon} **${test.name}**\n`;
      if (test.details) {
        markdown += `   - ${test.details}\n`;
      }
      markdown += `\n`;
    });

    fs.writeFileSync(path.join(reportDir, 'REPORT.md'), markdown);

    console.log('\n' + '='.repeat(60));

    if (testResults.failed === 0) {
      console.log('✅ ALL TESTS PASSED!');
      process.exit(0);
    } else {
      console.log(`❌ ${testResults.failed} TEST(S) FAILED`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAllTests();
