import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.resolve(process.cwd(), '../../docs/screenshots');

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '390', width: 390, height: 844 },
];

const ROLES = {
  student: { user: 'student', pass: 'password123', home: '/student/home' },
  tpo: { user: 'tpo_admin', pass: 'password123', home: '/tpo/home' },
  faculty: { user: 'faculty', pass: 'password123', home: '/faculty/home' },
  hod: { user: 'hod', pass: 'password123', home: '/hod/home' },
  management: { user: 'vice_chancellor', pass: 'password123', home: '/management/home' },
  admin: { user: 'admin', pass: 'password123', home: '/admin/home' },
};

async function loginUser(page, username, password) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 10000 });
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function verifyTypographyAndRoleLabels(page, url) {
  // Check that no visible text element has font-size < 12px
  const sub12Elements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('body *'));
    const bad = [];
    for (const el of all) {
      if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          const fontSize = parseFloat(style.fontSize);
          if (fontSize > 0 && fontSize < 11.9) {
            bad.push({ text: el.textContent.trim().substring(0, 30), size: style.fontSize });
          }
        }
      }
    }
    return bad;
  });

  // Check that no raw role code is displayed
  const rawRoleCodes = await page.evaluate(() => {
    const text = document.body.innerText;
    const codes = ['TPO_ADMIN', 'TPO_COORDINATOR', 'FACULTY_MENTOR', 'DEPARTMENT_HEAD', 'SCHOOL_HEAD', 'INSTITUTION_HEAD', 'STUDENT_MEMBER', 'INSTITUTION_ADMIN'];
    const found = [];
    for (const code of codes) {
      // allow if on admin dev pages or role debug tables
      if (text.includes(code) && !window.location.pathname.includes('/admin') && !window.location.pathname.includes('/dev')) {
        found.push(code);
      }
    }
    return found;
  });

  if (sub12Elements.length > 0) {
    console.warn(`[WARN ${url}] Found ${sub12Elements.length} sub-12px elements:`, sub12Elements.slice(0, 3));
  }
  if (rawRoleCodes.length > 0) {
    console.warn(`[WARN ${url}] Found raw role codes:`, rawRoleCodes);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  console.log('Chromium browser launched for Acceptance visual verification.');

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Capturing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const vpDir = path.join(OUTPUT_DIR, vp.name);
    fs.mkdirSync(vpDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. /login
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'login.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/login');
    console.log(`Captured: ${vp.name}/login.png`);

    // 2. Student flow
    await loginUser(page, ROLES.student.user, ROLES.student.pass);
    await page.goto(`${BASE_URL}/student/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'student_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/student/home');
    console.log(`Captured: ${vp.name}/student_home.png`);

    await page.goto(`${BASE_URL}/student/opportunities`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'student_opportunities_list.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/student/opportunities');
    console.log(`Captured: ${vp.name}/student_opportunities_list.png`);

    await page.goto(`${BASE_URL}/account/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'account_profile.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/account/profile');
    console.log(`Captured: ${vp.name}/account_profile.png`);

    // 3. TPO flow
    await loginUser(page, ROLES.tpo.user, ROLES.tpo.pass);
    await page.goto(`${BASE_URL}/tpo/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'tpo_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/tpo/home');
    console.log(`Captured: ${vp.name}/tpo_home.png`);

    await page.goto(`${BASE_URL}/tpo/drives`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'tpo_drives_list.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/tpo/drives');
    console.log(`Captured: ${vp.name}/tpo_drives_list.png`);

    await page.goto(`${BASE_URL}/tpo/students/STU001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'tpo_student_detail.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/tpo/students/STU001');
    console.log(`Captured: ${vp.name}/tpo_student_detail.png`);

    // 4. Faculty flow
    await loginUser(page, ROLES.faculty.user, ROLES.faculty.pass);
    await page.goto(`${BASE_URL}/faculty/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'faculty_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/faculty/home');
    console.log(`Captured: ${vp.name}/faculty_home.png`);

    // 5. HOD flow
    await loginUser(page, ROLES.hod.user, ROLES.hod.pass);
    await page.goto(`${BASE_URL}/hod/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'hod_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/hod/home');
    console.log(`Captured: ${vp.name}/hod_home.png`);

    // 6. Management flow
    await loginUser(page, ROLES.management.user, ROLES.management.pass);
    await page.goto(`${BASE_URL}/management/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'management_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/management/home');
    console.log(`Captured: ${vp.name}/management_home.png`);

    // 7. Admin & Dev flow
    await loginUser(page, ROLES.admin.user, ROLES.admin.pass);
    await page.goto(`${BASE_URL}/admin/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'admin_home.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/admin/home');
    console.log(`Captured: ${vp.name}/admin_home.png`);

    await page.goto(`${BASE_URL}/dev/cards`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(vpDir, 'dev_cards.png'), fullPage: true });
    await verifyTypographyAndRoleLabels(page, '/dev/cards');
    console.log(`Captured: ${vp.name}/dev_cards.png`);

    await context.close();
  }

  await browser.close();
  console.log('\nAll Acceptance screenshots captured successfully in docs/screenshots/');
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

