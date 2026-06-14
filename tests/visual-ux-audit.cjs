/**
 * Visual UX Audit - PrepHQ Dashboard
 * Captures screenshots of every tab, modal, and CRUD interaction
 * to confirm all functionalities are visually correct.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-results', 'visual-audit');

async function run() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Track errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:5173');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Register or log in as test user
  try {
    const regLink = page.locator('a:has-text("Register")');
    if (await regLink.isVisible()) {
      await regLink.click();
      await page.locator('input[type="text"]').fill('krishnateja1');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
    } else {
      await page.locator('input[type="text"]').fill('krishnateja1');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
    }
  } catch (e) {
    await page.locator('input[type="text"]').fill('krishnateja1');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
  }
  await page.waitForSelector('.nav-tab.active');
  await page.waitForTimeout(500);

  console.log('\n=== PrepHQ Visual UX Audit ===\n');

  // ========================================
  // 1. LEARNING DASHBOARD (default active)
  // ========================================
  console.log('1. Learning Dashboard (default)...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-learning-dashboard.png'), fullPage: true });
  
  // Check elements
  const dashboardTitle = await page.locator('h1').first().innerText();
  console.log(`   ✓ Title: "${dashboardTitle}"`);
  
  const metricCards = await page.locator('.metric-card').count();
  console.log(`   ✓ Metric cards rendered: ${metricCards}`);
  
  const capsules = await page.locator('.filter-capsule').count();
  console.log(`   ✓ Filter capsules rendered: ${capsules}`);
  
  const questions = await page.locator('.question-item').count();
  console.log(`   ✓ Question items rendered: ${questions}`);

  // Expand a question form
  await page.locator('.question-row-summary').first().click();
  await page.waitForTimeout(300);
  const formVisible = await page.locator('.question-detail-form').first().isVisible();
  console.log(`   ✓ Inline edit form expanded: ${formVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard-expanded-form.png'), fullPage: true });

  // ========================================
  // 2. COMPANY PROFILES TAB
  // ========================================
  console.log('\n2. Company Profiles Tab...');
  await page.click('button[data-tab="company-profiles"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-company-profiles.png'), fullPage: true });

  const companyCards = await page.locator('.company-card').count();
  console.log(`   ✓ Company cards rendered: ${companyCards}`);

  // Test View Prep Map modal
  await page.locator('.company-card').first().locator('button.view-prep-map-btn').click();
  await page.waitForTimeout(300);
  const detailModal = page.locator('#company-detail-modal');
  const detailVisible = await detailModal.isVisible();
  console.log(`   ✓ Detail modal opened: ${detailVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-company-detail-modal.png'), fullPage: true });
  await page.click('#close-company-modal');
  await page.waitForTimeout(200);

  // Test hover edit/delete overlay
  await page.locator('.company-card').first().hover();
  await page.waitForTimeout(300);
  const editBtn = page.locator('.company-card').first().locator('.edit-co-btn');
  const editVisible = await editBtn.isVisible();
  console.log(`   ✓ Hover edit button visible: ${editVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-company-card-hover.png'), fullPage: true });

  // Test Add Custom Company modal
  await page.click('#add-company-btn');
  await page.waitForTimeout(300);
  const crudModal = page.locator('#company-crud-modal');
  const crudVisible = await crudModal.isVisible();
  console.log(`   ✓ CRUD modal opened: ${crudVisible}`);
  
  // Fill and save
  await crudModal.locator('#company-crud-name').fill('Test Firm Corp');
  await crudModal.locator('#company-crud-type').fill('Quantitative Technology');
  await crudModal.locator('#company-crud-topics').fill('Machine Learning, System Design');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-company-crud-filled.png'), fullPage: true });
  await crudModal.locator('#company-crud-modal-submit').click();
  await page.waitForTimeout(300);
  
  const newCard = page.locator('.company-card:has-text("Test Firm Corp")');
  const newCardExists = await newCard.isVisible();
  console.log(`   ✓ New company card created: ${newCardExists}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-company-new-card.png'), fullPage: true });

  // Delete the test card
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await newCard.hover();
  await newCard.locator('.delete-co-btn').click();
  await page.waitForTimeout(300);
  const deletedCard = await page.locator('.company-card:has-text("Test Firm Corp")').isVisible();
  console.log(`   ✓ Test card deleted: ${!deletedCard}`);

  // ========================================
  // 3. INDUSTRY PATTERNS TAB
  // ========================================
  console.log('\n3. Industry Patterns Tab...');
  await page.click('button[data-tab="industry-patterns"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-industry-patterns.png'), fullPage: true });

  const patternItems = await page.locator('button.patterns-menu-item').count();
  console.log(`   ✓ Sidebar pattern items: ${patternItems}`);

  const docH2 = await page.locator('#patterns-doc-viewer h2').innerText();
  console.log(`   ✓ Active pattern title: "${docH2}"`);

  // Test sidebar switching
  await page.locator('button.patterns-menu-item:has-text("Thread Pinning")').click();
  await page.waitForTimeout(300);
  const newDocH2 = await page.locator('#patterns-doc-viewer h2').innerText();
  console.log(`   ✓ Pattern switched to: "${newDocH2}"`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-pattern-thread-pinning.png'), fullPage: true });

  // Test Edit button
  await page.locator('.edit-pat-btn').click();
  await page.waitForTimeout(300);
  const editPaneVisible = await page.locator('.pat-edit-title').isVisible();
  console.log(`   ✓ Edit slide pane opened: ${editPaneVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-pattern-edit-mode.png'), fullPage: true });
  
  // Cancel edit
  await page.locator('.cancel-pat-btn').click();
  await page.waitForTimeout(200);

  // ========================================
  // 4. TARGETED PREP PLAN TAB
  // ========================================
  console.log('\n4. Targeted Prep Plan Tab...');
  await page.click('button[data-tab="targeted-prep"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-targeted-prep.png'), fullPage: true });

  const weekCards = await page.locator('.prep-week-card').count();
  console.log(`   ✓ Week cards rendered: ${weekCards}`);

  const pctText = await page.locator('#prep-plan-pct').innerText();
  console.log(`   ✓ Blueprint progress: ${pctText}`);

  // Test inline task creator
  const firstWeekInput = page.locator('.new-prep-task-input').first();
  await firstWeekInput.fill('Visual UX test task');
  await page.locator('.add-prep-task-btn').first().click();
  await page.waitForTimeout(300);
  const newTask = page.locator('.prep-task-row:has-text("Visual UX test task")');
  const taskAdded = await newTask.isVisible();
  console.log(`   ✓ Inline task added: ${taskAdded}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-prep-task-added.png'), fullPage: true });

  // Check task checkbox to confirm progress recalculation
  const beforePct = await page.locator('#prep-plan-pct').innerText();
  await newTask.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(300);
  const afterPct = await page.locator('#prep-plan-pct').innerText();
  console.log(`   ✓ Progress before check: ${beforePct}, after: ${afterPct}`);

  // Delete the task
  await newTask.hover();
  await newTask.locator('.delete-task-btn').click();
  await page.waitForTimeout(300);
  const taskDeleted = !(await page.locator('.prep-task-row:has-text("Visual UX test task")').isVisible());
  console.log(`   ✓ Task deleted: ${taskDeleted}`);

  // Delete week button visibility check
  const deleteWeekBtn = page.locator('.delete-week-btn').first();
  const deleteWeekVisible = await deleteWeekBtn.isVisible();
  console.log(`   ✓ Delete week button visible: ${deleteWeekVisible}`);

  // ========================================
  // 5. STUDY NOTEBOOK TAB
  // ========================================
  console.log('\n5. Study Notebook Tab...');
  await page.click('button[data-tab="study-notebook"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-study-notebook.png'), fullPage: true });

  const treeRows = await page.locator('.nb-tree-row').count();
  console.log(`   ✓ Notebook tree rows: ${treeRows}`);

  // Click a note folder to expand it
  await page.locator('.nb-tree-row:has-text("Algorithms & Complexities")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-notebook-folder-overview.png'), fullPage: true });

  // Select the sub-page child node for document editing
  await page.locator('.nb-tree-row:has-text("Binary Search Deep Dive")').click();
  await page.waitForTimeout(300);
  const editorPane = page.locator('#nb-editor-pane');
  const editorVisible = await editorPane.isVisible();
  console.log(`   ✓ Editor pane visible: ${editorVisible}`);
  
  const noteTitle = await page.locator('#nb-note-title').inputValue();
  console.log(`   ✓ Active note title: "${noteTitle}"`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-notebook-editing.png'), fullPage: true });
  // Switch to read view
  await page.click('button:has-text("Read View")');
  await page.waitForTimeout(300);
  const bodyVisible = await page.locator('#nb-note-body').isVisible();
  console.log(`   ✓ Read view visible: ${bodyVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-notebook-read-view.png'), fullPage: true });

  // ========================================
  // 6. DARK/LIGHT THEME TOGGLE
  // ========================================
  console.log('\n6. Theme Toggle...');
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(400);
  const isDark = await page.locator('body').evaluate(el => el.classList.contains('dark-theme'));
  console.log(`   ✓ Switched to dark theme: ${isDark}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-dark-theme.png'), fullPage: true });

  // Switch back
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(300);
  const isLight = await page.locator('body').evaluate(el => el.classList.contains('light-theme'));
  console.log(`   ✓ Switched back to light theme: ${isLight}`);

  // ========================================
  // 7. MOBILE VIEWPORT TEST
  // ========================================
  console.log('\n7. Mobile Viewport Test...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(400);

  // Go to Study Notebook
  await page.locator('button[data-tab="study-notebook"]').filter({ visible: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-mobile-notebook.png'), fullPage: true });

  const toggleBtnVisible = await page.locator('#nb-sidebar-toggle-btn').isVisible();
  console.log(`   ✓ Mobile sidebar toggle visible: ${toggleBtnVisible}`);

  // Open drawer
  await page.click('#nb-sidebar-toggle-btn');
  await page.waitForTimeout(400);
  const backdropVisible = await page.locator('#nb-sidebar-backdrop').isVisible();
  console.log(`   ✓ Backdrop overlay visible: ${backdropVisible}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18-mobile-drawer-open.png'), fullPage: true });

  // Close drawer via backdrop
  await page.locator('#nb-sidebar-backdrop').click({ position: { x: 310, y: 150 } });
  await page.waitForTimeout(300);

  // Go to Targeted Prep on mobile
  await page.locator('button[data-tab="targeted-prep"]').filter({ visible: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '19-mobile-prep-plan.png'), fullPage: true });

  // Go to Company Profiles on mobile
  await page.locator('button[data-tab="company-profiles"]').filter({ visible: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '20-mobile-company-profiles.png'), fullPage: true });

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n========================================');
  console.log('=== VISUAL UX AUDIT SUMMARY ===');
  console.log('========================================');
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`Console errors captured: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((e, i) => console.log(`   ERROR ${i + 1}: ${e}`));
  } else {
    console.log('   ✅ No JavaScript console errors detected!');
  }
  console.log('========================================\n');

  await browser.close();
}

run().catch(err => {
  console.error('Visual audit script failed:', err);
  process.exit(1);
});
