/**
 * Chat Interface Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for the main chat interface including:
 * - Keyboard navigation
 * - ARIA attributes
 * - Color contrast
 * - Focus management
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Chat Interface Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		// Allow time for dynamic content to render
		await page.waitForTimeout(1000);
	});

	test('should have no critical accessibility violations on chat page', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Chat Interface Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`Description: ${v.description}`);
				console.log(`Help: ${v.help}`);
				console.log(`Nodes affected: ${v.nodes.length}`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 120)}...`);
				});
			});
		}

		expect(criticalViolations.length, 'No critical accessibility violations on chat page').toBe(0);
	});

	test('should support keyboard navigation in chat interface', async ({ page }) => {
		// Test Tab navigation through interactive elements
		const focusableElements = await page.locator(
			'button:visible, a:visible, input:visible, textarea:visible, [tabindex]:not([tabindex="-1"])'
		);
		const count = await focusableElements.count();

		expect(count).toBeGreaterThan(0);

		// Test that message input is keyboard accessible
		const messageInput = page
			.locator('textarea[placeholder*="message" i], textarea[aria-label*="message" i]')
			.first();
		if (await messageInput.isVisible()) {
			await messageInput.focus();
			await expect(messageInput).toBeFocused();
		}
	});

	test('should have proper ARIA labels on interactive elements', async ({ page }) => {
		// Check for buttons without accessible names
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast']) // Focus on ARIA/semantic issues
			.analyze();

		const ariaViolations = results.violations.filter(
			(v) => v.id.includes('aria') || v.id.includes('button-name') || v.id.includes('label')
		);

		if (ariaViolations.length > 0) {
			console.log('\n=== Chat ARIA Violations ===');
			ariaViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
			});
		}

		expect(ariaViolations.length, 'All interactive elements should have accessible names').toBe(0);
	});

	test('should maintain color contrast in light mode', async ({ page }) => {
		// Ensure light mode is active
		await page.emulateMedia({ colorScheme: 'light' });
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.disableRules(['aria-hidden-focus']) // Focus on contrast only
			.analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Chat Light Mode Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Light mode should meet WCAG AA contrast').toBe(0);
	});

	test('should maintain color contrast in dark mode', async ({ page }) => {
		// Ensure dark mode is active
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.disableRules(['aria-hidden-focus'])
			.analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Chat Dark Mode Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Dark mode should meet WCAG AA contrast').toBe(0);
	});

	test('should handle focus management correctly', async ({ page }) => {
		// Check that focus indicators are visible
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const focusViolations = results.violations.filter(
			(v) => v.id.includes('focus') || v.id === 'tabindex'
		);

		if (focusViolations.length > 0) {
			console.log('\n=== Chat Focus Management Violations ===');
			focusViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description}`);
			});
		}

		expect(focusViolations.length, 'Focus should be managed properly').toBe(0);
	});

	test('should be responsive at mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		expect(criticalViolations.length, 'Mobile viewport should have no critical violations').toBe(0);
	});

	test('should be responsive at tablet viewport', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 }); // iPad
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		expect(criticalViolations.length, 'Tablet viewport should have no critical violations').toBe(0);
	});
});
