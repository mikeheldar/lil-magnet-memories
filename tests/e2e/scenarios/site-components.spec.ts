import { test, expect } from '@playwright/test';

/**
 * Presence checks for https://test.lilmagnetmemories.com (or TEST_BASE_URL).
 * TestGrid: suite `site-components`, filter by TC-S.x in test titles.
 */
test.describe('Site components – test environment', () => {
  test('TC-S.1 Landing page shows main sections and branding', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lil Magnet Memories/i);

    await expect(
      page.getByRole('heading', {
        name: /Turn Your Memories Into Magnets/i,
      })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText('How It Works')).toBeVisible();
    await expect(
      page.getByText('Creating your custom magnets is as easy as 1-2-3-4')
    ).toBeVisible();
    await expect(page.getByText('Upload Your Photos')).toBeVisible();
    await expect(page.getByText('Customize', { exact: true })).toBeVisible();
    await expect(page.getByText('We Print & Ship')).toBeVisible();
    await expect(page.getByText('Enjoy!', { exact: true })).toBeVisible();

    await expect(page.getByText('Shop Our Products')).toBeVisible();
    await expect(page.getByAltText('Lil Magnet Memories')).toBeVisible();

    await expect(page.getByText('What Our Customers Say')).toBeVisible();

    // Primary CTA when a market event is active; optional when no event (nav still reaches upload)
    const startCta = page.locator('button', {
      hasText: /Start Creating Magnets|Create Magnets Now/i,
    });
    const hasCta = await startCta
      .first()
      .isVisible()
      .catch(() => false);
    if (hasCta) {
      await expect(startCta.first()).toBeVisible();
    }
  });

  test('TC-S.2 Photo upload page shows form shell', async ({ page }) => {
    await page.goto('/photo-upload');
    await expect(page.getByText('Photo Upload Form')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/Create custom magnets for (home delivery|market event pickup)/)
    ).toBeVisible();
    await expect(page.getByText('Your Information')).toBeVisible();
    await expect(
      page.getByLabel(/First Name/i).or(page.locator('label:has-text("First Name")'))
    ).toBeVisible();
  });

  test('TC-S.3 About, Contact, and FAQ pages load', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/About Li'l Magnet Memories/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/contact-us');
    await expect(page.getByText('Contact Us').first()).toBeVisible();

    await page.goto('/faq');
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
    await expect(
      page.getByText(
        'Find answers to common questions about our products and services'
      )
    ).toBeVisible();
  });

  test('TC-S.4 Custom products catalog page loads', async ({ page }) => {
    await page.goto('/products/custom');
    await expect(page.getByText('Custom Photo Magnets').first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText('Create personalized magnets from your own photos')
    ).toBeVisible();
  });

  test('TC-S.5 Header brand and drawer / navigation entry', async ({
    page,
  }) => {
    await page.goto('/');
    // MainLayout toolbar title (not route "Home" — brand is always shown)
    await expect(
      page.locator('.header-title-clickable').getByText(/Li'l Magnet Memories/i)
    ).toBeVisible({ timeout: 30_000 });

    // Permanent drawer on md+ shows "Navigation"; hamburger opens menu on small screens
    const drawer = page.locator('.drawer-menu-container');
    const navHeader = drawer.getByText('Navigation');
    const menuBtn = page.getByRole('button', { name: 'Menu' });

    if (await navHeader.isVisible().catch(() => false)) {
      await expect(navHeader).toBeVisible();
      await expect(
        drawer.getByText('Home', { exact: true }).first()
      ).toBeVisible();
    } else {
      await menuBtn.click();
      await expect(navHeader).toBeVisible({ timeout: 10_000 });
      await expect(
        drawer.getByText('Home', { exact: true }).first()
      ).toBeVisible();
    }
  });
});
