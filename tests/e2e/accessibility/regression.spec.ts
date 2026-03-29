/**
 * Accessibility Regression Tests
 *
 * Fast, comprehensive accessibility scan to catch regressions in CI.
 * Tests all major pages and interaction states.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Accessibility Regression Suite', () => {
	const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
	const reportDir = path.join(process.cwd(), 'test-results', 'accessibility', timestamp);

	test.beforeAll(async () => {
		// Create report directory
		if (!fs.existsSync(reportDir)) {
			fs.mkdirSync(reportDir, { recursive: true });
		}
	});

	test('homepage should have zero critical violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

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

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== REGRESSION: Critical Homepage Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`${v.description}`);
				console.log(`Affected nodes: ${v.nodes.length}`);
			});
		}

		expect(
			criticalViolations.length,
			`Found ${criticalViolations.length} critical violations. See ${reportDir}/homepage-report.json`
		).toBe(0);
	});

	test('should maintain accessibility across color schemes', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const violations = {
			light: 0,
			dark: 0
		};

		// Test light mode
		await page.emulateMedia({ colorScheme: 'light' });
		await page.waitForTimeout(500);
		const lightResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
		violations.light = lightResults.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		).length;

		fs.writeFileSync(
			path.join(reportDir, 'light-mode-report.json'),
			JSON.stringify(lightResults, null, 2)
		);

		// Test dark mode
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.waitForTimeout(500);
		const darkResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
		violations.dark = darkResults.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		).length;

		fs.writeFileSync(
			path.join(reportDir, 'dark-mode-report.json'),
			JSON.stringify(darkResults, null, 2)
		);

		console.log(`\nLight mode violations: ${violations.light}`);
		console.log(`Dark mode violations: ${violations.dark}`);

		expect(violations.light, 'Light mode should have zero critical violations').toBe(0);
		expect(violations.dark, 'Dark mode should have zero critical violations').toBe(0);
	});

	test('should be accessible across viewport sizes', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const viewports = [
			{ name: 'mobile', width: 375, height: 667 },
			{ name: 'tablet', width: 768, height: 1024 },
			{ name: 'desktop', width: 1920, height: 1080 }
		];

		for (const viewport of viewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.waitForTimeout(500);

			const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

			fs.writeFileSync(
				path.join(reportDir, `${viewport.name}-viewport-report.json`),
				JSON.stringify(results, null, 2)
			);

			const criticalViolations = results.violations.filter(
				(v) => v.impact === 'critical' || v.impact === 'serious'
			);

			console.log(
				`\n${viewport.name} (${viewport.width}x${viewport.height}): ${criticalViolations.length} critical violations`
			);

			expect(
				criticalViolations.length,
				`${viewport.name} viewport should have zero critical violations`
			).toBe(0);
		}
	});

	test('should generate comprehensive accessibility summary', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag21a'])
			.analyze();

		// Generate summary report
		const summary = {
			timestamp: new Date().toISOString(),
			url: page.url(),
			violations: {
				total: results.violations.length,
				critical: results.violations.filter((v) => v.impact === 'critical').length,
				serious: results.violations.filter((v) => v.impact === 'serious').length,
				moderate: results.violations.filter((v) => v.impact === 'moderate').length,
				minor: results.violations.filter((v) => v.impact === 'minor').length
			},
			passes: results.passes.length,
			incomplete: results.incomplete.length,
			inapplicable: results.inapplicable.length,
			violationsByType: results.violations.reduce(
				(acc, v) => {
					acc[v.id] = (acc[v.id] || 0) + v.nodes.length;
					return acc;
				},
				{} as Record<string, number>
			)
		};

		fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));

		// Generate human-readable summary
		const summaryText = `
# Accessibility Test Summary
Generated: ${summary.timestamp}
URL: ${summary.url}

## Violations
- Total: ${summary.violations.total}
- Critical: ${summary.violations.critical}
- Serious: ${summary.violations.serious}
- Moderate: ${summary.violations.moderate}
- Minor: ${summary.violations.minor}

## Passed Checks
- Total: ${summary.passes}

## Incomplete/Needs Review
- Total: ${summary.incomplete}

## Top Violation Types
${Object.entries(summary.violationsByType)
	.sort(([, a], [, b]) => b - a)
	.slice(0, 10)
	.map(([id, count]) => `- ${id}: ${count} nodes`)
	.join('\n')}

## Reports Location
${reportDir}
`;

		fs.writeFileSync(path.join(reportDir, 'summary.md'), summaryText);
		console.log(summaryText);

		expect(summary.violations.critical + summary.violations.serious).toBe(0);
	});

	test('should detect keyboard navigation violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		const keyboardViolations = results.violations.filter(
			(v) =>
				v.id.includes('keyboard') ||
				v.id === 'tabindex' ||
				v.id === 'focus-order-semantics' ||
				v.id.includes('focus')
		);

		if (keyboardViolations.length > 0) {
			console.log('\n=== Keyboard Navigation Violations ===');
			keyboardViolations.forEach((v) => {
				console.log(`${v.id} (${v.impact}): ${v.description}`);
			});
		}

		expect(keyboardViolations.length, 'Should have zero keyboard navigation violations').toBe(0);
	});

	test('should detect ARIA violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

		const ariaViolations = results.violations.filter(
			(v) =>
				v.id.includes('aria') || v.id === 'button-name' || v.id === 'link-name' || v.id === 'label'
		);

		if (ariaViolations.length > 0) {
			console.log('\n=== ARIA Violations ===');
			ariaViolations.forEach((v) => {
				console.log(`${v.id} (${v.impact}): ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(ariaViolations.length, 'Should have zero ARIA violations').toBe(0);
	});

	test('should detect color contrast violations', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Color Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 5).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
					if (node.any && node.any.length > 0) {
						console.log(`    Contrast: ${node.any[0].data?.contrastRatio || 'unknown'}`);
					}
				});
			});
		}

		expect(contrastViolations.length, 'Should have zero color contrast violations').toBe(0);
	});
});
