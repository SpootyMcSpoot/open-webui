/**
 * Manual Accessibility Test Runner
 *
 * Since @playwright/test has dependency issues, we'll run axe-core
 * tests using the playwright library directly.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const reportDir = path.join(process.cwd(), 'test-results', 'accessibility', timestamp);

// Ensure report directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

async function runA11yTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting accessibility tests...\n');

  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Inject axe-core manually
    console.log('💉 Injecting axe-core...');
    await page.addScriptTag({
      path: './node_modules/axe-core/axe.min.js'
    });

    // Run axe analysis
    console.log('🔬 Running axe-core analysis...');
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run(
          {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa']
            }
          },
          (err, results) => {
            if (err) throw err;
            resolve(results);
          }
        );
      });
    });

    // Save full report
    fs.writeFileSync(
      path.join(reportDir, 'homepage-report.json'),
      JSON.stringify(results, null, 2)
    );

    // Take screenshot
    await page.screenshot({
      path: path.join(reportDir, 'homepage-screenshot.png'),
      fullPage: true
    });

    // Analyze results
    const violations = results.violations;
    const criticalViolations = violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    console.log('\n📊 ACCESSIBILITY TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total violations: ${violations.length}`);
    console.log(`Critical/Serious: ${criticalViolations.length}`);
    console.log(`Moderate: ${violations.filter((v) => v.impact === 'moderate').length}`);
    console.log(`Minor: ${violations.filter((v) => v.impact === 'minor').length}`);
    console.log(`Passed checks: ${results.passes.length}`);
    console.log(`Incomplete: ${results.incomplete.length}`);

    // Detail critical violations
    if (criticalViolations.length > 0) {
      console.log('\n❌ CRITICAL/SERIOUS VIOLATIONS:');
      console.log('-'.repeat(60));
      criticalViolations.forEach((v, idx) => {
        console.log(`\n${idx + 1}. ${v.id} (${v.impact})`);
        console.log(`   Description: ${v.description}`);
        console.log(`   Help: ${v.help}`);
        console.log(`   Affected nodes: ${v.nodes.length}`);
        if (v.nodes.length > 0) {
          console.log(`   Example: ${v.nodes[0].html.substring(0, 120)}...`);
        }
      });
    }

    // Test form labels specifically
    console.log('\n🏷️  FORM LABEL ANALYSIS');
    console.log('-'.repeat(60));
    const labelViolations = violations.filter(
      (v) => v.id === 'label' || v.id === 'label-title-only' || v.id.includes('form-field')
    );
    console.log(`Form label violations: ${labelViolations.length}`);
    if (labelViolations.length > 0) {
      labelViolations.forEach((v) => {
        console.log(`  - ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
      });
    } else {
      console.log('  ✅ All form controls have proper labels');
    }

    // Test ARIA labels
    console.log('\n🎯 ARIA LABEL ANALYSIS');
    console.log('-'.repeat(60));
    const ariaViolations = violations.filter(
      (v) => v.id.includes('aria') || v.id === 'button-name' || v.id === 'link-name'
    );
    console.log(`ARIA violations: ${ariaViolations.length}`);
    if (ariaViolations.length > 0) {
      ariaViolations.forEach((v) => {
        console.log(`  - ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
      });
    } else {
      console.log('  ✅ All interactive elements have proper ARIA labels');
    }

    // Test color contrast
    console.log('\n🎨 COLOR CONTRAST ANALYSIS');
    console.log('-'.repeat(60));
    const contrastViolations = violations.filter((v) => v.id === 'color-contrast');
    console.log(`Color contrast violations: ${contrastViolations.length}`);
    if (contrastViolations.length > 0) {
      console.log(`  Found ${contrastViolations[0].nodes.length} nodes with insufficient contrast`);
      contrastViolations[0].nodes.slice(0, 3).forEach((node, idx) => {
        console.log(`  ${idx + 1}. ${node.html.substring(0, 80)}...`);
      });
    } else {
      console.log('  ✅ All text meets WCAG AA contrast requirements');
    }

    // Test keyboard navigation
    console.log('\n⌨️  KEYBOARD NAVIGATION TEST');
    console.log('-'.repeat(60));
    const keyboardViolations = violations.filter(
      (v) => v.id.includes('keyboard') || v.id === 'tabindex' || v.id.includes('focus')
    );
    console.log(`Keyboard violations: ${keyboardViolations.length}`);
    if (keyboardViolations.length > 0) {
      keyboardViolations.forEach((v) => {
        console.log(`  - ${v.id}: ${v.description}`);
      });
    } else {
      console.log('  ✅ No keyboard navigation violations detected');
    }

    // Test across viewports
    console.log('\n📱 RESPONSIVE ACCESSIBILITY TEST');
    console.log('-'.repeat(60));
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const viewportResults = await page.evaluate(() => {
        return new Promise((resolve) => {
          // @ts-ignore
          axe.run({ runOnly: { type: 'tag', values: ['wcag2aa'] } }, (err, results) => {
            if (err) throw err;
            resolve(results);
          });
        });
      });

      const viewportCritical = viewportResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      console.log(`  ${viewport.name} (${viewport.width}x${viewport.height}): ${viewportCritical.length} critical violations`);
    }

    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      violations: {
        total: violations.length,
        critical: violations.filter((v) => v.impact === 'critical').length,
        serious: violations.filter((v) => v.impact === 'serious').length,
        moderate: violations.filter((v) => v.impact === 'moderate').length,
        minor: violations.filter((v) => v.impact === 'minor').length
      },
      passes: results.passes.length,
      formLabels: labelViolations.length === 0,
      ariaLabels: ariaViolations.length === 0,
      colorContrast: contrastViolations.length === 0,
      keyboardNav: keyboardViolations.length === 0
    };

    fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));

    console.log('\n📁 Reports saved to:', reportDir);
    console.log('\n' + '='.repeat(60));

    if (criticalViolations.length === 0) {
      console.log('✅ SUCCESS: No critical accessibility violations found!');
      process.exit(0);
    } else {
      console.log(`❌ FAILED: Found ${criticalViolations.length} critical/serious violations`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runA11yTests();
