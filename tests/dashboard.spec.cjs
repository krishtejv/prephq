const { test, expect } = require('@playwright/test');

test.describe('PrepHQ Full E2E & UX Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`PAGE CONSOLE ERROR: ${msg.text()}`);
      }
    });
    // Navigate to the local server
    await page.goto('http://localhost:5173');
    // Clear localStorage to start with a fresh clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Generate a unique random username for perfect test isolation
    const testUsername = `testuser_${Math.floor(Math.random() * 1000000)}`;

    // Click toggle to show the Register form
    await page.locator('button:has-text("Create profile")').click();

    // Register the fresh test user
    await page.locator('input[type="text"]').fill(testUsername);
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('input[type="password"]').nth(1).fill('password123');
    await page.locator('button[type="submit"]').click();

    // Wait for successful login redirect
    await expect(page.locator('.nav-tab.active')).toBeVisible({ timeout: 5000 });
  });

  test('1. Navigation Tab Router Validation', async ({ page }) => {
    // Assert active default is Learning Dashboard
    await expect(page.locator('.nav-tab.active')).toContainText('Learning Dashboard');
    await expect(page.locator('#tab-learning-dashboard')).toHaveClass(/active/);

    // Switch to Company Profiles
    await page.click('button[data-tab="company-profiles"]:visible');
    await expect(page.locator('.nav-tab.active')).toContainText('Company Profiles');
    await expect(page.locator('#tab-company-profiles')).toHaveClass(/active/);

    // Switch to Industry Patterns
    await page.click('button[data-tab="industry-patterns"]:visible');
    await expect(page.locator('.nav-tab.active')).toContainText('Industry Patterns');
    await expect(page.locator('#tab-industry-patterns')).toHaveClass(/active/);

    // Switch to Targeted Prep Plan
    await page.click('button[data-tab="targeted-prep"]:visible');
    await expect(page.locator('.nav-tab.active')).toContainText('Targeted Prep Plan');
    await expect(page.locator('#tab-targeted-prep')).toHaveClass(/active/);

    // Switch to Study Notebook
    await page.click('button[data-tab="study-notebook"]:visible');
    await expect(page.locator('.nav-tab.active')).toContainText('Study Notebook');
    await expect(page.locator('#tab-study-notebook')).toHaveClass(/active/);
  });

  test('2. Reactive Light/Dark Theme Switcher', async ({ page }) => {
    // Verify default is light theme
    await expect(page.locator('body')).toHaveClass(/light-theme/);

    // Click theme toggle to switch to dark
    await page.click('#theme-toggle-btn');
    await expect(page.locator('body')).toHaveClass(/dark-theme/);

    // Verify localStorage persistence
    const savedTheme = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('prephq_state_store'));
      return state ? state.theme : null;
    });
    expect(savedTheme).toBe('dark');

    // Click theme toggle again to revert to light
    await page.click('#theme-toggle-btn');
    await expect(page.locator('body')).toHaveClass(/light-theme/);
  });

  test('3. Company Profile Modal Overlay Sheets', async ({ page }) => {
    // Switch to Company Profiles
    await page.click('button[data-tab="company-profiles"]:visible');

    // Click Citadel Securities prep map button
    const citadelCard = page.locator('.company-card:has-text("Citadel / Citadel Securities")');
    await citadelCard.locator('button.view-prep-map-btn').click();

    // Verify modal overlay opens
    const modal = page.locator('#company-detail-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2')).toContainText('Citadel / Citadel Securities');
    await expect(modal.locator('.timeline-step')).toHaveCount(3);

    // Close modal using close button
    await page.click('#close-company-modal');
    await expect(modal).toBeHidden();

    // Re-open and close by clicking overlay backdrop
    await citadelCard.locator('button.view-prep-map-btn').click();
    await expect(modal).toBeVisible();
    await modal.click({ position: { x: 5, y: 5 } }); // click edge/overlay area
    await expect(modal).toBeHidden();
  });

  test('4. Industry Patterns Sliding Blueprints', async ({ page }) => {
    // Switch to Industry Patterns
    await page.click('button[data-tab="industry-patterns"]:visible');

    // Select LMAX Disruptor sidebar button
    const disruptorBtn = page.locator('button.patterns-menu-item:has-text("LMAX Disruptor Pattern")');
    await expect(disruptorBtn).toHaveClass(/active/);

    // Click Core Affinity thread pinning pattern
    const cpuAffinityBtn = page.locator('button.patterns-menu-item:has-text("Thread Pinning & CPU Affinity")');
    await cpuAffinityBtn.click();
    await expect(cpuAffinityBtn).toHaveClass(/active/);

    // Verify document display updates
    const docViewer = page.locator('#patterns-doc-viewer');
    await expect(docViewer.locator('h2')).toContainText('Thread Pinning & CPU Affinity');
    await expect(docViewer.locator('.code-block-display')).toContainText('pthread_setaffinity_np');
  });

  test('5. Targeted Prep Plan Reactive Progress Calculations', async ({ page }) => {
    // Switch to Targeted Prep Plan
    await page.click('button[data-tab="targeted-prep"]:visible');

    // Get current progress percentage
    const initialPercentText = await page.locator('#prep-plan-pct').innerText();
    const initialPercent = parseInt(initialPercentText);

    // Select a task checkbox (e.g. first unchecked task)
    const uncheckedCheckbox = page.locator('.prep-task-checkbox:has-text("Implement a Lock-Free Ring Buffer") input[type="checkbox"]');
    await expect(uncheckedCheckbox).not.toBeChecked();
    
    // Check it
    await uncheckedCheckbox.check();

    // Verify progress text and bar recalculate instantly
    const newPercentText = await page.locator('#prep-plan-pct').innerText();
    const newPercent = parseInt(newPercentText);
    expect(newPercent).toBeGreaterThan(initialPercent);

    const progressFillWidth = await page.locator('#prep-plan-bar').getAttribute('style');
    expect(progressFillWidth).toContain(`${newPercent}%`);
  });

  test('6. Learning Dashboard capsules and Inline Edit Forms', async ({ page }) => {
    // Click Networking filter capsule
    await page.click('button.filter-capsule:has-text("Networking")');

    // Confirm list filtered correctly
    await expect(page.locator('.category-title')).toContainText('L4 Protocols');
    await expect(page.locator('.question-title-text').first()).toContainText('TCP Connection Setup');

    // Expand "TCP Connection Setup" row
    const questionRow = page.locator('.question-item:has-text("TCP Connection Setup")');
    await questionRow.click();

    // Verify inline editing form slides down
    const form = questionRow.locator('.question-detail-form');
    await expect(form).toBeVisible();

    // Update status to "Needs Review" and write note text
    await form.locator('select.q-status-select').selectOption('Needs Review');
    await form.locator('textarea.q-notes-input').fill('Prism.js syntax parsing and UDP packet streams tested.');
    await form.locator('button.save-form-btn').click();

    // Verify form hides
    await expect(form).toBeHidden();

    // Verify badge updated in row list
    await expect(questionRow.locator('.status-badge')).toContainText('Needs Review');

    // Register a dynamic dialog handler to handle sequential prompts and confirmations
    page.on('dialog', async dialog => {
      const msg = dialog.message();
      if (msg.includes('Enter active category track name:')) {
        await dialog.accept('Advanced L4 bypassing');
      } else if (msg.includes('Enter short question title:')) {
        await dialog.accept('How does mlockall bypass swapping?');
      } else if (msg.includes('Delete this question record?')) {
        await dialog.accept();
      }
    });

    // Click Custom Question trigger (which triggers both prompts synchronously in app.js)
    await page.click('#add-question-btn');

    // Verify new question row is rendered and automatically expanded
    const newRow = page.locator('.question-item:has-text("How does mlockall bypass swapping?")');
    await expect(newRow).toBeVisible();
    await expect(newRow.locator('.question-detail-form')).toBeVisible();

    // Delete question record
    await newRow.locator('button.delete-q-btn').click();

    // Verify row removed
    await expect(newRow).toBeHidden();
  });

  test('7. Obsidian Study Notebook Node CRUD and Markdown Callout Compilers', async ({ page }) => {
    // Switch to Study Notebook
    await page.click('button[data-tab="study-notebook"]:visible');

    // Select the default Algorithms note folder to expand it
    await page.locator('.nb-tree-row:has-text("Algorithms & Complexities")').click();

    // Select the sub-page child node for document editing
    await page.locator('.nb-tree-row:has-text("Binary Search Deep Dive")').click();

    // Verify workspace loaded
    await expect(page.locator('#nb-editor-pane')).toBeVisible();
    await expect(page.locator('#nb-note-title')).toHaveValue('Binary Search Deep Dive');

    // Edit Markdown content to include custom callout alerts
    const textarea = page.locator('#nb-note-body');
    await textarea.evaluate(el => { el.innerHTML = ''; });
    await textarea.fill('# Big-O Performance\n\n> [!NOTE]\n> High-frequency quant execution must run in O(1) time.\n\n> [!WARNING]\n> Thread context switching triggers kernel bottlenecks.');

    // Switch to Read View to verify callouts parse and compile
    await page.click('button:has-text("Read View")');
    await expect(page.locator('#nb-note-body')).toBeVisible();

    // Verify compiled premium callout div structures
    const body = page.locator('#nb-note-body');
    const noteCallout = body.locator('.rendered-callout.callout-note');
    await expect(noteCallout).toBeVisible();
    await expect(noteCallout.locator('.callout-title')).toContainText('NOTE');
    await expect(noteCallout.locator('.callout-body')).toContainText('High-frequency quant execution must run in O(1) time.');

    const warningCallout = body.locator('.rendered-callout.callout-warning');
    await expect(warningCallout).toBeVisible();
    await expect(warningCallout.locator('.callout-title')).toContainText('WARNING');
    
    // Add sub-note node
    const firstRow = page.locator('.nb-tree-row:has-text("Algorithms & Complexities")');
    await firstRow.hover();
    await firstRow.locator('.nb-node-menu-btn').click();
    await page.locator('.nb-node-add-child-btn').click();

    // Fill page title modal
    const addModal = page.locator('#nb-add-modal');
    await expect(addModal).toBeVisible();
    await addModal.locator('#nb-add-name').fill('Sub-second low latency sockets');
    await addModal.locator('#nb-add-modal-submit').click();
    await expect(addModal).toBeHidden();

    // Verify node is visible in sidebar tree structure
    const newNoteNode = page.locator('.nb-tree-row:has-text("Sub-second low latency sockets")');
    await expect(newNoteNode).toBeVisible();

    // Rename sub-note
    await newNoteNode.hover();
    await newNoteNode.locator('.nb-node-menu-btn').click();
    await page.locator('.nb-node-rename-btn').click();
    const renameModal = page.locator('#nb-rename-modal');
    await expect(renameModal).toBeVisible();
    await renameModal.locator('#nb-rename-input').fill('User-space low latency bypass');
    await renameModal.locator('#nb-rename-modal-submit').click();
    await expect(renameModal).toBeHidden();
    
    // Verify name changed
    await expect(page.locator('.nb-tree-row:has-text("User-space low latency bypass")')).toBeVisible();

    // Delete sub-note recursively
    const renamedNode = page.locator('.nb-tree-row:has-text("User-space low latency bypass")');
    await renamedNode.hover();
    await renamedNode.locator('.nb-node-menu-btn').click();
    await page.locator('.nb-node-delete-btn').click();
    const deleteModal = page.locator('#nb-delete-modal');
    await expect(deleteModal).toBeVisible();
    await deleteModal.locator('#nb-delete-modal-submit').click();
    await expect(deleteModal).toBeHidden();

    // Verify sub-note removed from tree
    await expect(renamedNode).toBeHidden();
  });

  test('8. Study Notebook Mobile Viewport and sliding Drawer Layout', async ({ page }) => {
    // Set simulated mobile device viewport size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Switch to Study Notebook
    await page.click('button[data-tab="study-notebook"]:visible');

    // Confirm that the floating drawer trigger button is visible on mobile
    const toggleBtn = page.locator('#nb-sidebar-toggle-btn');
    await expect(toggleBtn).toBeVisible();

    // Verify note sidebar is positioned off-screen (left is negative/outside container)
    const sidebar = page.locator('.nb-sidebar');
    const container = page.locator('#nb-shell');
    const containerLeft = await container.evaluate(el => el.getBoundingClientRect().left);

    const xPosBefore = await sidebar.evaluate(el => el.getBoundingClientRect().left);
    expect(xPosBefore).toBeLessThan(containerLeft);

    // Click toggle button
    await toggleBtn.click();

    // Verify note sidebar transitions to align with container left edge (visible/aligned drawer, allowing 1px for border)
    const xPosAfter = await sidebar.evaluate(el => el.getBoundingClientRect().left);
    expect(Math.abs(xPosAfter - containerLeft)).toBeLessThanOrEqual(1.5);

    // Verify translucent backdrop overlay is visible
    const backdrop = page.locator('#nb-sidebar-backdrop');
    await expect(backdrop).toBeVisible();

    // Click note node from tree
    await page.locator('.nb-tree-row:has-text("Binary Search Deep Dive")').click();

    // Verify note loads in editor workspace
    await expect(page.locator('#nb-note-title')).toHaveValue('Binary Search Deep Dive');

    // Verify note tree sidebar automatically slides out/closes on selection
    const xPosSelect = await sidebar.evaluate(el => el.getBoundingClientRect().left);
    expect(xPosSelect).toBeLessThan(containerLeft);
    await expect(backdrop).toBeHidden();

    // Open drawer again
    await toggleBtn.click();
    expect(Math.abs((await sidebar.evaluate(el => el.getBoundingClientRect().left)) - containerLeft)).toBeLessThanOrEqual(1.5);

    // Click on the right side of the backdrop overlay (outside the 280px drawer) to close the drawer manually
    await backdrop.click({ position: { x: 310, y: 150 } });
    await expect(backdrop).toBeHidden();
    expect(await sidebar.evaluate(el => el.getBoundingClientRect().left)).toBeLessThan(containerLeft);
  });

  test('9. Company Profiles CRUD & Custom Loops Editor modal', async ({ page }) => {
    // Switch to Company Profiles
    await page.click('button[data-tab="company-profiles"]:visible');

    // Click Add Custom Company
    await page.click('#add-company-btn');

    // Verify Add Custom Company modal overlay opens
    const crudModal = page.locator('#company-crud-modal');
    await expect(crudModal).toBeVisible();
    await expect(crudModal.locator('#company-crud-modal-title')).toContainText('Add Custom Company');

    // Fill details
    await crudModal.locator('#company-crud-name').fill('Akuna Capital');
    await crudModal.locator('#company-crud-type').fill('Proprietary Market Maker');
    await crudModal.locator('#company-crud-topics').fill('C++ templates, FPGA design, Linux memory management');

    // Add round row
    await crudModal.locator('#company-crud-add-round-btn').click();
    // Fill the OA round (since one is added by default)
    const firstRoundRow = crudModal.locator('.company-crud-round-row').first();
    await firstRoundRow.locator('.round-title-input').fill('Online Assessment (OA)');
    await firstRoundRow.locator('.round-desc-input').fill('2-hour algorithmic math and template-heavy coding test.');

    // Add second round row
    await crudModal.locator('#company-crud-add-round-btn').click();
    const secondRoundRow = crudModal.locator('.company-crud-round-row').nth(1);
    await secondRoundRow.locator('.round-title-input').fill('Statistical Concurrency Onsite');
    await secondRoundRow.locator('.round-desc-input').fill('Game theory design and atomic memory barriers onsite panel.');

    // Save profile
    await crudModal.locator('#company-crud-modal-submit').click();
    await expect(crudModal).toBeHidden();

    // Verify new company card appears in grid
    const akunaCard = page.locator('.company-card:has-text("Akuna Capital")');
    await expect(akunaCard).toBeVisible();
    await expect(akunaCard.locator('.company-type')).toContainText('Proprietary Market Maker');

    // Hover and click edit button
    await akunaCard.hover();
    await akunaCard.locator('.edit-co-btn').click();

    // Verify modal loads values correctly
    await expect(crudModal).toBeVisible();
    await expect(crudModal.locator('#company-crud-name')).toHaveValue('Akuna Capital');
    await expect(crudModal.locator('#company-crud-type')).toHaveValue('Proprietary Market Maker');
    await expect(crudModal.locator('.round-title-input').first()).toHaveValue('Online Assessment (OA)');
    await expect(crudModal.locator('.round-title-input').nth(1)).toHaveValue('Statistical Concurrency Onsite');

    // Edit value
    await crudModal.locator('#company-crud-topics').fill('C++ templates, FPGA design, Linux memory management, GPU pipelines');
    await crudModal.locator('#company-crud-modal-submit').click();
    await expect(crudModal).toBeHidden();

    // Setup dialog deletion confirmation handler
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Delete company profile "Akuna Capital"?')) {
        await dialog.accept();
      }
    });

    // Delete company profile card
    await akunaCard.hover();
    await akunaCard.locator('.delete-co-btn').click();

    // Assert card is deleted
    await expect(akunaCard).toBeHidden();
  });

  test('10. Industry Patterns CRUD Slide compilation & Deletions', async ({ page }) => {
    // Switch to Industry Patterns
    await page.click('button[data-tab="industry-patterns"]:visible');

    // Register active dialog interceptor before click
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Enter new blueprint title:')) {
        await dialog.accept('Solarflare EF_VI Ring');
      } else if (dialog.message().includes('Delete architectural blueprint "Solarflare EF_VI Ring"?')) {
        await dialog.accept();
      }
    });

    // Click Add Pattern button
    await page.click('#add-pattern-btn');

    // Verify slide edit pane is rendered in viewer
    const docViewer = page.locator('#patterns-doc-viewer');
    await expect(docViewer.locator('.pat-edit-title')).toHaveValue('Solarflare EF_VI Ring');
    await expect(docViewer.locator('.pat-edit-subtitle')).toHaveValue('Custom Low-Latency Slide Blueprint');

    // Update details
    await docViewer.locator('.pat-edit-subtitle').fill('High Performance Direct Ring Buffer Access');
    await docViewer.locator('.pat-edit-content').fill('<h3>Solarflare EF_VI</h3><p>Raw hardware packet queues bypass kernel socket buffers.</p><div class="code-block-display">ef_eventq_poll();</div>');
    await docViewer.locator('.save-pat-btn').click();

    // Verify slide viewer compiles and renders beautifully
    await expect(docViewer.locator('h2')).toContainText('Solarflare EF_VI Ring');
    await expect(docViewer.locator('p').first()).toContainText('High Performance Direct Ring Buffer Access');
    await expect(docViewer.locator('h3')).toContainText('Solarflare EF_VI');
    await expect(docViewer.locator('.code-block-display')).toContainText('ef_eventq_poll();');

    // Select LMAX Disruptor from sidebar navigation to verify navigation works
    const disruptorBtn = page.locator('button.patterns-menu-item:has-text("LMAX Disruptor Pattern")');
    await disruptorBtn.click();
    await expect(docViewer.locator('h2')).toContainText('LMAX Disruptor Pattern');

    // Click back to Solarflare EF_VI Ring sidebar button
    const efviBtn = page.locator('button.patterns-menu-item:has-text("Solarflare EF_VI Ring")');
    await efviBtn.click();
    await expect(docViewer.locator('h2')).toContainText('Solarflare EF_VI Ring');

    // Delete pattern
    await docViewer.locator('.delete-pat-btn').click();

    // Verify removed from menu sidebar and content fallback
    await expect(efviBtn).toBeHidden();
    await expect(docViewer.locator('h2')).toBeHidden();
  });

  test('11. Targeted Prep timelines CRUD & custom task creators', async ({ page }) => {
    // Switch to Targeted Prep Plan
    await page.click('button[data-tab="targeted-prep"]:visible');

    // Handle dialog triggers
    page.on('dialog', async dialog => {
      if (dialog.message().includes('Enter custom week title:')) {
        await dialog.accept('FPGA Trading Gates');
      } else if (dialog.message().includes('Enter focus area details:')) {
        await dialog.accept('Hardware execution pathways');
      } else if (dialog.message().includes('Delete Week 7 and all its tasks?')) {
        await dialog.accept();
      }
    });

    // Click Add Custom Week Block
    await page.click('#add-prep-week-btn');

    // Verify new card appended at the bottom
    const newWeekCard = page.locator('.prep-week-card:has-text("FPGA Trading Gates")');
    await expect(newWeekCard).toBeVisible();
    await expect(newWeekCard.locator('.week-pill')).toContainText('Wk 7');

    // Locate inline input & button inside the new week card
    const input = newWeekCard.locator('.new-prep-task-input');
    const addBtn = newWeekCard.locator('.add-prep-task-btn');

    // Add first task
    await input.fill('Solve Akuna FPGA OA design questions');
    await addBtn.click();

    // Add second task via Enter key
    await input.fill('Synthesize simple ring buffer in SystemVerilog');
    await input.press('Enter');

    // Verify tasks list contains both tasks
    const firstTask = newWeekCard.locator('.prep-task-row:has-text("Solve Akuna FPGA OA design questions")');
    const secondTask = newWeekCard.locator('.prep-task-row:has-text("Synthesize simple ring buffer in SystemVerilog")');
    await expect(firstTask).toBeVisible();
    await expect(secondTask).toBeVisible();

    // Verify Progress recalibration by checking one task checkbox
    const initialPercentText = await page.locator('#prep-plan-pct').innerText();
    const initialPercent = parseInt(initialPercentText);

    // Check task
    await firstTask.locator('input[type="checkbox"]').check();

    // Assert percent increased
    const newPercentText = await page.locator('#prep-plan-pct').innerText();
    const newPercent = parseInt(newPercentText);
    expect(newPercent).toBeGreaterThan(initialPercent);

    // Hover over second task row and click delete task button
    await secondTask.hover();
    await secondTask.locator('.delete-task-btn').click();

    // Verify second task removed
    await expect(secondTask).toBeHidden();

    // Delete week
    await newWeekCard.locator('.delete-week-btn').click();

    // Verify week removed from DOM
    await expect(newWeekCard).toBeHidden();
  });
});
