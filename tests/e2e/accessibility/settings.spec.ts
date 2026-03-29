/**
 * Settings Page Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for settings interface including:
 * - Form controls accessibility
 * - Label associations
 * - Keyboard navigation
 * - Color contrast
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Settings Page Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		// Try to navigate to settings - common patterns
		const settingsButton = page
			.locator(
				'button[aria-label*="settings" i], button[title*="settings" i], a[href*="settings" i]'
			)
			.first();

		if (await settingsButton.isVisible()) {
			await settingsButton.click();
			await page.waitForTimeout(500);
		}
	});

	test('should have no critical accessibility violations on settings page', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Settings Page Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`Description: ${v.description}`);
				console.log(`Nodes affected: ${v.nodes.length}`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 120)}...`);
				});
			});
		}

		expect(criticalViolations.length, 'No critical violations on settings page').toBe(0);
	});

	test('should have proper form labels', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const labelViolations = results.violations.filter(
			(v) => v.id === 'label' || v.id === 'label-title-only' || v.id.includes('form-field')
		);

		if (labelViolations.length > 0) {
			console.log('\n=== Settings Form Label Violations ===');
			labelViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(labelViolations.length, 'All form controls should have associated labels').toBe(0);
	});

	test('should support keyboard navigation in settings', async ({ page }) => {
		// Check that interactive elements are keyboard accessible
		const focusableElements = await page.locator(
			'button:visible, a:visible, input:visible, select:visible, [role="switch"]:visible, [role="checkbox"]:visible'
		);
		const count = await focusableElements.count();

		expect(count).toBeGreaterThan(0);

		// Test Tab navigation
		await page.keyboard.press('Tab');
		const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
		expect(focusedElement).toBeTruthy();
	});

	test('should have proper ARIA attributes on interactive controls', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const ariaViolations = results.violations.filter(
			(v) => v.id.includes('aria') || v.id.includes('role') || v.id.includes('button-name')
		);

		if (ariaViolations.length > 0) {
			console.log('\n=== Settings ARIA Violations ===');
			ariaViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(ariaViolations.length, 'All controls should have proper ARIA attributes').toBe(0);
	});

	test('should maintain color contrast in settings forms', async ({ page }) => {
		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Settings Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Settings should meet WCAG AA contrast').toBe(0);
	});

	test('should be accessible at mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		expect(criticalViolations.length, 'Mobile settings should have no critical violations').toBe(0);
	});
});
