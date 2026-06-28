import { test, expect } from '@playwright/test';

// Drives the real client-side interactivity of the homepage. These assertions
// fail if hydration breaks or a handler is wired wrong — things tsc/SSR cannot catch.

const money = (s: string) => Number(s.replace(/[^0-9]/g, ''));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('hero carousel advances on Next and Prev', async ({ page }) => {
  const h1 = page.locator('h1').first();
  await expect(h1).toContainText('Packaging that sells');

  await page.getByRole('button', { name: 'Next category' }).click();
  await expect(h1).toContainText('First impressions');

  await page.getByRole('button', { name: 'Previous category' }).click();
  await expect(h1).toContainText('Packaging that sells');
});

test('hero category tabs jump to a slide', async ({ page }) => {
  await page.getByRole('button', { name: 'Go to Signage & Displays' }).click();
  await expect(page.locator('h1').first()).toContainText('Signage');
});

test('configurator recomputes price when finish changes', async ({ page }) => {
  const total = page.getByTestId('config-total');
  await total.scrollIntoViewIfNeeded();
  const before = money(await total.innerText());

  // Gold foil has the highest finish multiplier — price must rise.
  await page.getByRole('button', { name: 'Gold foil' }).click();
  await expect.poll(async () => money(await total.innerText())).toBeGreaterThan(before);
});

test('configurator recomputes price when material changes', async ({ page }) => {
  const total = page.getByTestId('config-total');
  await total.scrollIntoViewIfNeeded();
  const before = money(await total.innerText());

  await page.getByRole('button', { name: 'Rigid board' }).click();   // 1.8× multiplier
  await expect.poll(async () => money(await total.innerText())).toBeGreaterThan(before);
});

test('quote estimator express raises the total', async ({ page }) => {
  const total = page.getByTestId('estimate-total');
  await total.scrollIntoViewIfNeeded();
  const before = money(await total.innerText());

  await page.getByRole('button', { name: /Express/ }).click();
  await expect.poll(async () => money(await total.innerText())).toBeGreaterThan(before);
});

test('certifications stats count up into view', async ({ page }) => {
  const stat = page.getByText('500+', { exact: false });
  await stat.scrollIntoViewIfNeeded();
  await expect(stat).toBeVisible();
});

test('no console errors on load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Ignore the products API fetch failing (backend not running in this env).
  const real = errors.filter((e) => !/Failed to load resource|fetch failed|favicon/i.test(e));
  expect(real, real.join('\n')).toHaveLength(0);
});
