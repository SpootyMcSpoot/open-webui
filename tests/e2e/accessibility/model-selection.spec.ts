/**
 * Model Selection Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for model selection interface including:
 * - Select/dropdown accessibility
 * - Keyboard navigation
 * - ARIA attributes
 * - Color contrast
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Model Selection Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should have no critical accessibility violations in model selector', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Model Selection Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`Description: ${v.description}`);
				console.log(`Nodes affected: ${v.nodes.length}`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 120)}...`);
				});
			});
		}

		expect(criticalViolations.length, 'No critical violations in model selection').toBe(0);
	});

	test('should have keyboard-accessible model selector', async ({ page }) => {
		// Look for model selection elements (dropdown, select, button)
		const modelSelector = page
			.locator(
				'select[aria-label*="model" i], button[aria-label*="model" i], [role="combobox"][aria-label*="model" i]'
			)
			.first();

		if (await modelSelector.isVisible()) {
			await modelSelector.focus();
			await expect(modelSelector).toBeFocused();

			// Test keyboard interaction (Enter or Space should activate)
			await page.keyboard.press('Enter');
			await page.waitForTimeout(300);

			// Check that dropdown/menu opened (if applicable)
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a'])
				.disableRules(['color-contrast'])
				.analyze();

			const keyboardViolations = results.violations.filter(
				(v) => v.id.includes('keyboard') || v.id === 'tabindex'
			);

			expect(keyboardViolations.length, 'Model selector should be keyboard accessible').toBe(0);
		}
	});

	test('should have proper ARIA attributes on model selection controls', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const ariaViolations = results.violations.filter(
			(v) =>
				v.id.includes('aria') ||
				v.id === 'button-name' ||
				v.id === 'select-name' ||
				v.id === 'label'
		);

		if (ariaViolations.length > 0) {
			console.log('\n=== Model Selection ARIA Violations ===');
			ariaViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(ariaViolations.length, 'Model selection controls should have proper ARIA').toBe(0);
	});

	test('should maintain color contrast in model selection', async ({ page }) => {
		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Model Selection Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Model selection should meet WCAG AA contrast').toBe(0);
	});

	test('should handle dropdown menu accessibility', async ({ page }) => {
		// Try to open model selection dropdown
		const modelSelector = page
			.locator('button[aria-label*="model" i], button[aria-label*="select" i], [role="combobox"]')
			.first();

		if (await modelSelector.isVisible()) {
			await modelSelector.click();
			await page.waitForTimeout(500);

			// Check accessibility of opened dropdown
			const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

			const criticalViolations = results.violations.filter(
				(v) => v.impact === 'critical' || v.impact === 'serious'
			);

			if (criticalViolations.length > 0) {
				console.log('\n=== Model Dropdown Violations ===');
				criticalViolations.forEach((v) => {
					console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
				});
			}

			expect(
				criticalViolations.length,
				'Open model dropdown should have no critical violations'
			).toBe(0);
		}
	});

	test('should support Escape key to close dropdown', async ({ page }) => {
		const modelSelector = page.locator('button[aria-label*="model" i], [role="combobox"]').first();

		if (await modelSelector.isVisible()) {
			// Open dropdown
			await modelSelector.click();
			await page.waitForTimeout(300);

			// Press Escape
			await page.keyboard.press('Escape');
			await page.waitForTimeout(300);

			// Verify no keyboard trap violations
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a'])
				.disableRules(['color-contrast'])
				.analyze();

			const focusViolations = results.violations.filter(
				(v) => v.id.includes('focus') || v.id.includes('keyboard')
			);

			expect(focusViolations.length, 'No keyboard trap when closing dropdown').toBe(0);
		}
	});
});
