import { expect, test } from '@playwright/test';

/*
 * The builder's own behaviour is covered where the builder lives, in
 * skeryl/quilt-builder, against a harness that is only the element. What is
 * left here is what that repo cannot see: that the package is installed and
 * defines its tag, and that this page holds it the way it should.
 */

const ROUTE = '/journal/quilt-builder';

test.use({ viewport: { width: 1440, height: 1400 } });

test('the element arrives and draws the builder', async ({ page }) => {
	await page.goto(ROUTE);

	await expect(page.locator('quilt-builder')).toBeAttached();
	await page.waitForFunction(() => !!customElements.get('quilt-builder'));

	// And it is really the builder, not an empty tag: a quilt to work on.
	await expect(page.locator('[data-cell-index="0"]')).toBeVisible();
	await expect(page.locator('quilt-builder .masthead')).toHaveText('Quilt Builder');
});

test('the wall is given the page gutters back, and reaches the window', async ({ page }) => {
	/*
	 * The builder fits its box by default; the full bleed is this page handing
	 * .layout-padded's own gutters over through the tokens. If that ever stops
	 * arriving, the wall quietly stops at the text column instead.
	 */
	await page.goto(ROUTE);
	await expect(page.locator('[data-cell-index="0"]')).toBeVisible();

	const { inner, viewport, overflow } = await page.evaluate(() => ({
		inner: document.querySelector('quilt-builder .qb')!.getBoundingClientRect(),
		viewport: window.innerWidth,
		overflow: document.documentElement.scrollWidth - window.innerWidth
	}));
	expect(Math.round(inner.width)).toBe(viewport);
	expect(Math.round(inner.left)).toBe(0);
	// Reaching the window is not the same as spilling past it.
	expect(overflow).toBe(0);
});

test('the builder takes the whole of the room this page gives it', async ({ page }) => {
	/*
	 * The element is a flex item here, and this page sizes the element rather
	 * than what is inside it. When the content ignored that room the quilt
	 * wall lost a quarter of its height and every square shrank with it.
	 * Nothing looked broken, which is why it is measured rather than eyeballed.
	 */
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(ROUTE);
	await expect(page.locator('[data-cell-index="0"]')).toBeVisible();
	await page.evaluate(() => document.fonts.ready);

	const room = await page.evaluate(() => {
		const el = document.querySelector('quilt-builder')!;
		return {
			given: el.getBoundingClientRect().height,
			taken: el.firstElementChild!.getBoundingClientRect().height
		};
	});
	// It may ask for more than it is given. What it must not do is take less.
	expect(Math.round(room.taken)).toBeGreaterThanOrEqual(Math.round(room.given));
});
