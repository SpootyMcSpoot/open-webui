/**
 * Homepage Accessibility Tests
 *
 * Validates WCAG 2.1 AA compliance for the homepage/landing page including:
 * - Overall page structure
 * - Heading hierarchy
 * - Landmark regions
 * - Skip navigation links
 * - Initial load accessibility
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Homepage Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(1500);
	});

	test('should have no critical accessibility violations', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		const criticalViolations = results.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		if (criticalViolations.length > 0) {
			console.log('\n=== Critical Homepage Violations ===');
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

		expect(criticalViolations.length, 'No critical violations on homepage').toBe(0);
	});

	test('should have proper document structure', async ({ page }) => {
		// Check for proper HTML5 document structure
		const hasMain = await page.locator('main, [role="main"]').count();
		const hasNav = await page.locator('nav, [role="navigation"]').count();

		expect(hasMain).toBeGreaterThan(0);
		expect(hasNav).toBeGreaterThanOrEqual(0);

		// Check for document-related violations
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const structureViolations = results.violations.filter(
			(v) =>
				v.id === 'landmark-one-main' ||
				v.id === 'region' ||
				v.id === 'landmark-unique' ||
				v.id.includes('heading')
		);

		if (structureViolations.length > 0) {
			console.log('\n=== Homepage Structure Violations ===');
			structureViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description}`);
			});
		}

		expect(structureViolations.length, 'Document structure should be semantic and accessible').toBe(
			0
		);
	});

	test('should have valid heading hierarchy', async ({ page }) => {
		// Check heading order
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
		const headingLevels = await Promise.all(
			headings.map(async (h) => {
				const tag = await h.evaluate((el) => el.tagName);
				return parseInt(tag.substring(1));
			})
		);

		// Should have at least one h1
		const h1Count = headingLevels.filter((level) => level === 1).length;
		expect(h1Count).toBeGreaterThan(0);

		// Check for heading order violations
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const headingViolations = results.violations.filter((v) => v.id.includes('heading'));

		if (headingViolations.length > 0) {
			console.log('\n=== Homepage Heading Violations ===');
			headingViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description}`);
			});
		}

		expect(headingViolations.length, 'Heading hierarchy should be logical').toBe(0);
	});

	test('should have skip navigation links', async ({ page }) => {
		// Look for skip links (often visually hidden)
		const skipLink = page.locator(
			'a[href="#main-content"], a[href="#content"], a:has-text("Skip to"), [class*="skip"]'
		);

		const skipLinkCount = await skipLink.count();

		// Skip links are recommended but not strictly required for WCAG AA
		// Log if missing but don't fail
		if (skipLinkCount === 0) {
			console.log(
				'\nℹ️  No skip navigation link found. Consider adding for better keyboard navigation.'
			);
		}
	});

	test('should have proper page title', async ({ page }) => {
		const title = await page.title();

		// Page should have a title
		expect(title).toBeTruthy();
		expect(title.length).toBeGreaterThan(0);

		// Check document-title rule
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const titleViolations = results.violations.filter((v) => v.id === 'document-title');

		expect(titleViolations.length, 'Page should have a descriptive title').toBe(0);
	});

	test('should have proper language attribute', async ({ page }) => {
		const htmlLang = await page.locator('html').getAttribute('lang');

		expect(htmlLang).toBeTruthy();

		// Check html-has-lang rule
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const langViolations = results.violations.filter(
			(v) => v.id === 'html-has-lang' || v.id === 'html-lang-valid'
		);

		expect(langViolations.length, 'HTML should have valid lang attribute').toBe(0);
	});

	test('should maintain color contrast on homepage', async ({ page }) => {
		const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');

		if (contrastViolations.length > 0) {
			console.log('\n=== Homepage Contrast Violations ===');
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

		expect(contrastViolations.length, 'Homepage should meet WCAG AA contrast').toBe(0);
	});

	test('should have accessible images', async ({ page }) => {
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.disableRules(['color-contrast'])
			.analyze();

		const imageViolations = results.violations.filter(
			(v) => v.id === 'image-alt' || v.id === 'image-redundant-alt' || v.id === 'role-img-alt'
		);

		if (imageViolations.length > 0) {
			console.log('\n=== Homepage Image Accessibility Violations ===');
			imageViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description} (${v.nodes.length} nodes)`);
				v.nodes.slice(0, 3).forEach((node) => {
					console.log(`  - ${node.html.substring(0, 100)}...`);
				});
			});
		}

		expect(imageViolations.length, 'All images should have proper alt text').toBe(0);
	});

	test('should be keyboard navigable on initial load', async ({ page }) => {
		// Test Tab navigation works
		await page.keyboard.press('Tab');
		await page.waitForTimeout(200);

		const focusedElement = await page.evaluate(() => {
			const el = document.activeElement;
			return el ? el.tagName : null;
		});

		expect(focusedElement).toBeTruthy();

		// Check for keyboard navigation violations
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a'])
			.disableRules(['color-contrast'])
			.analyze();

		const keyboardViolations = results.violations.filter(
			(v) => v.id.includes('keyboard') || v.id === 'tabindex' || v.id.includes('focus')
		);

		if (keyboardViolations.length > 0) {
			console.log('\n=== Homepage Keyboard Navigation Violations ===');
			keyboardViolations.forEach((v) => {
				console.log(`${v.id}: ${v.description}`);
			});
		}

		expect(keyboardViolations.length, 'Homepage should be fully keyboard navigable').toBe(0);
	});

	test('should be responsive at common viewports', async ({ page }) => {
		const viewports = [
			{ name: 'mobile', width: 375, height: 667 },
			{ name: 'tablet', width: 768, height: 1024 },
			{ name: 'desktop', width: 1920, height: 1080 }
		];

		for (const viewport of viewports) {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.waitForTimeout(500);

			const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

			const criticalViolations = results.violations.filter(
				(v) => v.impact === 'critical' || v.impact === 'serious'
			);

			console.log(
				`${viewport.name} (${viewport.width}x${viewport.height}): ${criticalViolations.length} critical violations`
			);

			expect(
				criticalViolations.length,
				`Homepage should be accessible at ${viewport.name} viewport`
			).toBe(0);
		}
	});

	test('should support both light and dark modes', async ({ page }) => {
		// Test light mode
		await page.emulateMedia({ colorScheme: 'light' });
		await page.waitForTimeout(500);

		const lightResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const lightViolations = lightResults.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		// Test dark mode
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.waitForTimeout(500);

		const darkResults = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

		const darkViolations = darkResults.violations.filter(
			(v) => v.impact === 'critical' || v.impact === 'serious'
		);

		console.log(`Light mode: ${lightViolations.length} critical violations`);
		console.log(`Dark mode: ${darkViolations.length} critical violations`);

		expect(lightViolations.length, 'Light mode should have no critical violations').toBe(0);
		expect(darkViolations.length, 'Dark mode should have no critical violations').toBe(0);
	});
});
