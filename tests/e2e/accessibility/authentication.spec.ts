/**
 * Authentication Flow Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for authentication flows including:
 * - Sign in/login page
 * - Sign up/registration page
 * - Form labels and error messages
 * - Password visibility toggles
 * - Keyboard navigation
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication Flow Accessibility', () => {
	test('should have no critical violations on login page', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1000);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Login Page Violations ===');
			criticalViolations.forEach((v) => {
				console.log(`\n${v.id} (${v.impact})`);
				console.log(`Description: ${v.description}`);
				console.log(`Nodes affected: ${v.nodes.length}`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 120)}...`);
				});
			});
		}

		expect(criticalViolations.length, 'No critical violations on login page').toBe(0);
	});

	test('should have proper form labels on login form', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const labelViolations = results.violations.filter(
			(v) =>
				v.id === 'label' ||
				v.id === 'label-title-only' ||
				v.id.includes('form-field') ||
				v.id === 'input-button-name'
		);

		if (labelViolations.length > 0) {
			console.log('\n=== Login Form Label Violations ===');
			labelViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(labelViolations.length, 'All login form inputs should have proper labels').toBe(0);
	});

	test('should support keyboard navigation on login form', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		// Check for keyboard-accessible form elements
		const formElements = await page.locator(
			'input:visible, button:visible, a:visible, [tabindex]:not([tabindex="-1"])'
		);
		const count = await formElements.count();

		expect(count).toBeGreaterThan(0);

		// Test Tab navigation through form
		await page.keyboard.press('Tab');
		const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
		expect(focusedElement).toBeTruthy();

		// Check for keyboard navigation violations
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const keyboardViolations = results.violations.filter(
			(v) => v.id.includes('keyboard') || v.id === 'tabindex'
		);

		expect(keyboardViolations.length, 'Login form should be fully keyboard accessible').toBe(0);
	});

	test('should have accessible password visibility toggle', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		// Look for password toggle button
		const passwordToggle = page
			.locator(
				'button[aria-label*="password" i], button[title*="show" i], button[title*="hide" i]'
			)
			.first();

		if (await passwordToggle.isVisible()) {
			// Check that it has an accessible name
			const ariaLabel = await passwordToggle.getAttribute('aria-label');
			const title = await passwordToggle.getAttribute('title');

			expect(ariaLabel || title).toBeTruthy();

			// Test keyboard accessibility
			await passwordToggle.focus();
			await expect(passwordToggle).toBeFocused();
		}
	});

	test('should display accessible error messages', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		// Try to submit form with invalid data to trigger errors
		const submitButton = page
			.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")')
			.first();

		if (await submitButton.isVisible()) {
			await submitButton.click();
			await page.waitForTimeout(1000);

			// Check for ARIA live regions or error messages
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa'])
				.disableRules(['color-contrast'])
				.analyze();

			const ariaViolations = results.violations.filter(
				(v) => v.id.includes('aria') || v.id === 'label'
			);

			if (ariaViolations.length > 0) {
				console.log('\n=== Error Message ARIA Violations ===');
				ariaViolations.forEach((v) => {
					console.log(`${v.id}: ${v.description}`);
				});
			}

			expect(ariaViolations.length, 'Error messages should be accessible').toBe(0);
		}
	});

	test('should maintain color contrast on auth page', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Auth Page Contrast Violations ===');
			contrastViolations.forEach((v) => {
				console.log(`${v.nodes.length} nodes with insufficient contrast`);
				v.nodes.slice(0, 5).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(contrastViolations.length, 'Auth page should meet WCAG AA contrast').toBe(0);
	});

	test('should be accessible at mobile viewport', async ({ page }) => {
		await page.goto('/auth');
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		expect(criticalViolations.length, 'Mobile auth page should have no critical violations').toBe(
			0
		);
	});

	test('should handle focus management on form submission', async ({ page }) => {
		await page.goto('/auth');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(500);

		// Focus first input
		const firstInput = page.locator('input:visible').first();
		if (await firstInput.isVisible()) {
			await firstInput.focus();
			await expect(firstInput).toBeFocused();

			// Try to submit
			await page.keyboard.press('Tab');
			await page.keyboard.press('Enter');
			await page.waitForTimeout(500);

			// Check for focus management violations
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a'])
				.disableRules(['color-contrast'])
				.analyze();

			const focusViolations = results.violations.filter((v) => v.id.includes('focus'));

			expect(focusViolations.length, 'Focus should be managed properly after submission').toBe(0);
		}
	});
});
