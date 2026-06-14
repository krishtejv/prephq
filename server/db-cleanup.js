import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'prephq.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Run queries sequentially and close properly
function runCleanup() {
  console.log('Cleaning up database test states...');

  db.serialize(() => {
    // 1. Clean notebook_pages table (remove sub-note artifacts)
    db.run(
      `DELETE FROM notebook_pages WHERE title LIKE '%latency%' OR title LIKE '%bypass%' OR id LIKE '%sub-second%'`,
      function(err) {
        if (err) console.error('Error cleaning notebook_pages:', err.message);
        else console.log(`Cleared ${this.changes} pages from notebook_pages.`);
      }
    );

    // 2. Clean study_state table JSON arrays
    db.all("SELECT user_id, prep_plan, domains, neetcode, companies, patterns FROM study_state", (err, rows) => {
      if (err) {
        console.error('Error selecting study_state:', err.message);
        db.close();
        return;
      }

      let pending = rows.length;
      if (pending === 0) {
        db.close(() => console.log('Database cleanup completed successfully.'));
        return;
      }

      let updatesCount = 0;
      for (const row of rows) {
        let updated = false;

        // Clean companies
        let cos = [];
        try {
          cos = JSON.parse(row.companies || '[]');
        } catch (e) {}
        const initialCoLength = cos.length;
        cos = cos.filter(c => c.name !== 'Akuna Capital' && c.name !== 'Test Firm Corp');
        if (cos.length !== initialCoLength) updated = true;

        // Clean prep_plan
        let plan = [];
        try {
          plan = JSON.parse(row.prep_plan || '[]');
        } catch (e) {}
        const initialPlanLength = plan.length;
        plan = plan.filter(w => w.title !== 'FPGA Trading Gates' && w.week <= 6);
        if (plan.length !== initialPlanLength) updated = true;

        // Clean domains custom questions
        let doms = {};
        try {
          doms = JSON.parse(row.domains || '{}');
        } catch (e) {}
        let domsUpdated = false;
        Object.keys(doms).forEach(dKey => {
          const dom = doms[dKey];
          if (dom && dom.categories) {
            // Remove custom category 'Advanced L4 bypassing'
            if (dom.categories['Advanced L4 bypassing']) {
              delete dom.categories['Advanced L4 bypassing'];
              domsUpdated = true;
            }
            // Remove custom questions matching pattern
            Object.keys(dom.categories).forEach(cat => {
              const initialLen = dom.categories[cat].length;
              dom.categories[cat] = dom.categories[cat].filter(
                q => q.title !== 'How does mlockall bypass swapping?'
              );
              if (dom.categories[cat].length !== initialLen) domsUpdated = true;
            });
          }
        });
        if (domsUpdated) updated = true;

        // Clean patterns
        let pats = [];
        try {
          pats = JSON.parse(row.patterns || '[]');
        } catch (e) {}
        const initialPatsLength = pats.length;
        pats = pats.filter(p => p.title !== 'Solarflare EF_VI Ring');
        if (pats.length !== initialPatsLength) updated = true;
 
        if (updated) {
          updatesCount++;
          db.run(
            "UPDATE study_state SET companies = ?, prep_plan = ?, domains = ?, patterns = ? WHERE user_id = ?",
            [JSON.stringify(cos), JSON.stringify(plan), JSON.stringify(doms), JSON.stringify(pats), row.user_id],
            function(err) {
              if (err) console.error(`Failed to update study_state for ${row.user_id}:`, err.message);
              else console.log(`Cleaned state slices for user ${row.user_id}.`);
              
              pending--;
              if (pending === 0) {
                db.close(() => console.log(`Database cleanup completed successfully. Cleaned ${updatesCount} user rows.`));
              }
            }
          );
        } else {
          pending--;
          if (pending === 0) {
            db.close(() => console.log(`Database cleanup completed successfully. Cleaned ${updatesCount} user rows.`));
          }
        }
      }
    });
  });
}

runCleanup();
