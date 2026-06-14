const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  // Login
  await page.locator('input[type="text"]').fill('krishnateja1');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('.nav-tab.active');
  
  console.log('Logged in successfully!');
  await page.waitForTimeout(1000); // Wait for API fetch
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.filter-capsule')).map(el => ({
      tag: el.tagName,
      html: el.outerHTML,
      text: el.innerText,
      classes: el.className
    }));
  });
  
  console.log('Found filter-capsules:', buttons.length);
  buttons.forEach((b, i) => {
    console.log(`\nButton ${i}:`);
    console.log(`Tag: ${b.tag}`);
    console.log(`Text: ${JSON.stringify(b.text)}`);
    console.log(`Classes: ${b.classes}`);
    console.log(`HTML: ${b.html}`);
  });
  
  await browser.close();
}

run().catch(console.error);
