import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.resolve(__dirname, '../docs');
const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'https://ecomm-may2026.onrender.com';

const waitForPage = async (page) => {
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
};

async function capture() {
  await mkdir(DOCS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Capturing storefront...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPage(page);
  await page.screenshot({ path: path.join(DOCS_DIR, 'storefront.png'), fullPage: false });

  console.log('Capturing products page...');
  await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPage(page);

  const productLink = page.locator('a[href*="/products/"]').first();
  await productLink.waitFor({ timeout: 30000 });
  const href = await productLink.getAttribute('href');
  console.log('Capturing product detail...', href);
  await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPage(page);
  await page.screenshot({ path: path.join(DOCS_DIR, 'product-detail.png'), fullPage: false });

  console.log('Logging in as admin...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitForPage(page);
  await page.fill('input[type="email"]', 'admin@store.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  await page.waitForURL(/\/admin/, { timeout: 60000 }).catch(async () => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  });
  await waitForPage(page);
  await page.screenshot({ path: path.join(DOCS_DIR, 'admin-dashboard.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots saved to', DOCS_DIR);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
