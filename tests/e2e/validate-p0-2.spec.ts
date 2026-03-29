/**
 * P0-2 Color Contrast Validation Script
 *
 * Validates WCAG 2.1 AA color contrast compliance (4.5:1 for normal text)
 * after implementing P0-2 accessibility fixes.
 */

import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('P0-2 Color Contrast Validation', () => {
	test('should have zero critical color contrast violations', async ({ page }) => {
		// Navigate to Open-WebUI (assuming dev server at localhost:5173)
		await page.goto('http://localhost:5173');

		// Wait for app to fully render
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(2000);

		// Run axe-core scan focused on color contrast
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		// Filter for color-contrast violations only
		const contrastViolations = results.violations.filter(
			(violation) => violation.id === 'color-contrast'
		);

		// Generate detailed report
		const report = {
			timestamp: new Date().toISOString(),
			url: page.url(),
			summary: {
				totalViolations: results.violations.length,
				contrastViolations: contrastViolations.length,
				contrastNodes: contrastViolations.reduce((sum, v) => sum + v.nodes.length, 0)
			},
			violations: results.violations.map((violation) => ({
				id: violation.id,
				impact: violation.impact,
				description: violation.description,
				help: violation.help,
				helpUrl: violation.helpUrl,
				nodes: violation.nodes.map((node) => ({
					html: node.html,
					target: node.target,
					failureSummary: node.failureSummary
				}))
			})),
			passes: results.passes
				.filter((pass) => pass.id === 'color-contrast')
				.map((pass) => ({
					id: pass.id,
					description: pass.description,
					nodes: pass.nodes.length
				}))
		};

		// Save report to file (in project root)
		const projectRoot = path.join(__dirname, '../..');
		const reportPath = path.join(projectRoot, 'p0-2-validation-report.json');
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		console.log(`\nValidation report saved to: ${reportPath}`);

		// Take screenshot as evidence
		const screenshotPath = path.join(projectRoot, 'p0-2-validation-screenshot.png');
		await page.screenshot({ path: screenshotPath, fullPage: true });
		console.log(`Screenshot saved to: ${screenshotPath}`);

		// Log summary
		console.log('\n=== P0-2 Color Contrast Validation Summary ===');
		console.log(`Total violations: ${report.summary.totalViolations}`);
		console.log(`Color contrast violations: ${report.summary.contrastViolations}`);
		console.log(`Affected nodes: ${report.summary.contrastNodes}`);

		if (contrastViolations.length > 0) {
			console.log('\n❌ Color Contrast Violations Found:');
			contrastViolations.forEach((violation) => {
				console.log(`\n  ${violation.id} (${violation.impact})`);
				console.log(`  ${violation.description}`);
				console.log(`  Affected nodes: ${violation.nodes.length}`);
				violation.nodes.slice(0, 5).forEach((node) => {
					console.log(`    - ${node.html.substring(0, 100)}...`);
				});
			});
		} else {
			console.log('\n✅ No color contrast violations found!');
		}

		// Assertion: expect zero color contrast violations
		expect(
			contrastViolations.length,
			`Expected zero color-contrast violations but found ${contrastViolations.length}. ` +
				`Check ${reportPath} for details.`
		).toBe(0);
	});

	test('should pass WCAG 2.1 AA compliance', async ({ page }) => {
		await page.goto('http://localhost:5173');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page }).withTags(['wcag21aa']).analyze();

		// Check for critical/serious violations
		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n❌ Critical/Serious WCAG 2.1 AA Violations:');
			criticalViolations.forEach((v) => {
				console.log(`  - ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(criticalViolations.length).toBe(0);
	});
});
