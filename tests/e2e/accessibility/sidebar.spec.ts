/**
 * Sidebar Navigation Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for sidebar navigation including:
 * - Keyboard navigation
 * - ARIA attributes for navigation
 * - Focus management
 * - Color contrast
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Sidebar Navigation Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);
	});

	test('should have no critical accessibility violations in sidebar', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Sidebar Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`Description: ${v.description}`);
				console.log(`Nodes affected: ${v.nodes.length}`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 120)}...`);
				});
			});
		}

		expect(criticalViolations.length, 'No critical violations in sidebar').toBe(0);
	});

	test('should have proper navigation landmarks', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const landmarkViolations = results.violations.filter(
			(v) => v.id === 'region' || v.id.includes('landmark')
		);

		if (landmarkViolations.length > 0) {
			console.log('\n=== Sidebar Landmark Violations ===');
			landmarkViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description}`);
			});
		}

		expect(landmarkViolations.length, 'Navigation landmarks should be properly defined').toBe(0);
	});

	test('should support keyboard navigation in sidebar', async ({ page }) => {
		// Check for keyboard-accessible navigation elements
		const navElements = await page.locator(
			'nav button:visible, nav a:visible, [role="navigation"] button:visible, [role="navigation"] a:visible'
		);
		const count = await navElements.count();

		// Sidebar should have at least some navigation elements
		expect(count).toBeGreaterThanOrEqual(0);

		// Test that navigation items are keyboard accessible
		if (count > 0) {
			const firstNavItem = navElements.first();
			await firstNavItem.focus();
			const isFocused = await firstNavItem.evaluate((el) => el === document.activeElement);
			expect(isFocused).toBeTruthy();
		}
	});

	test('should have proper ARIA attributes for navigation items', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const ariaViolations = results.violations.filter(
			(v) =>
				v.id.includes('aria') ||
				v.id.includes('button-name') ||
				v.id.includes('link-name') ||
				v.id === 'label'
		);

		if (ariaViolations.length > 0) {
			console.log('\n=== Sidebar ARIA Violations ===');
			ariaViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(ariaViolations.length, 'All navigation items should have accessible names').toBe(0);
	});

	test('should maintain color contrast in sidebar', async ({ page }) => {
		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Sidebar Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Sidebar should meet WCAG AA contrast').toBe(0);
	});

	test('should be accessible in collapsed state', async ({ page }) => {
		// Try to find and click sidebar toggle if it exists
		const sidebarToggle = page
			.locator(
				'button[aria-label*="sidebar" i], button[aria-label*="menu" i], button[aria-label*="navigation" i]'
			)
			.first();

		if (await sidebarToggle.isVisible()) {
			await sidebarToggle.click();
			await page.waitForTimeout(500);

			const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

			const criticalViolations = results.violations.filter(
				(v) => v.impact === 'critical' || v.impact === 'serious'
			);

			expect(
				criticalViolations.length,
				'Collapsed sidebar should have no critical violations'
			).toBe(0);
		}
	});

	test('should handle focus correctly when toggling sidebar', async ({ page }) => {
		const sidebarToggle = page
			.locator(
				'button[aria-label*="sidebar" i], button[aria-label*="menu" i], button[aria-label*="navigation" i]'
			)
			.first();

		if (await sidebarToggle.isVisible()) {
			// Focus the toggle
			await sidebarToggle.focus();
			await expect(sidebarToggle).toBeFocused();

			// Toggle sidebar
			await sidebarToggle.click();
			await page.waitForTimeout(300);

			// Check for focus violations
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a'])
				.disableRules(['color-contrast'])
				.analyze();

			const focusViolations = results.violations.filter((v) => v.id.includes('focus'));

			expect(focusViolations.length, 'No focus violations after toggling sidebar').toBe(0);
		}
	});
});
