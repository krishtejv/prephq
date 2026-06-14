import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { initializeDatabase, dbRun, dbGet, dbAll } from './database.js';
import { authenticateToken, generateToken } from './authMiddleware.js';
import { DEFAULT_NOTEBOOK_PAGES, DEFAULT_STUDY_STATE } from './defaultSeed.js';
import logger from './logger.js';

// ── Process-level crash guards ─────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5001;
const IS_PROD = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet());

// HTTP request logging (every request logged with method, url, status, responseTime)
app.use(pinoHttp({ logger, autoLogging: true }));

// Middlewares
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' })); // Standard API requests cap at 2mb

// Auth rate limiter — max 15 attempts per 15 minutes per IP (relaxed in dev/test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Global API rate limiter — max 200 requests per minute per IP (relaxed in dev/test)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: IS_PROD ? 200 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.' }
});
app.use('/api/user', apiLimiter);
app.use('/api/notebook', apiLimiter);

// --------------------------------------------------------------------------
// Auth endpoints
// --------------------------------------------------------------------------

// Register User
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password || username.trim().length === 0 || password.trim().length === 0) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username.trim().length > 50) {
    return res.status(400).json({ error: 'Username must be 50 characters or fewer.' });
  }

  if (password.trim().length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Choose another.' });
    }

    const userId = randomUUID(); // Fix #17: crypto.randomUUID() instead of Math.random()
    const hashedPassword = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    // Insert user
    await dbRun(
      'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
      [userId, username.trim(), hashedPassword, createdAt]
    );

    // Seed blank state — new users start with no domains or data
    await dbRun(
      `INSERT INTO study_state (user_id, streak, last_studied_date, prep_plan, domains, neetcode, companies, patterns) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        0,
        null,
        '[]',
        '{}',
        '[]',
        '[]',
        '[]'
      ]
    );

    const token = generateToken({ id: userId, username });
    logger.info({ userId, username }, '[Auth Register] New user registered');
    res.status(201).json({ message: 'User registered and seeded successfully.', token, user: { id: userId, username } });
  } catch (err) {
    logger.error({ err }, '[Auth Register] Registration failed');
    res.status(500).json({ error: 'Registration failed due to server error.' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken({ id: user.id, username: user.username });
    logger.info({ userId: user.id, username: user.username }, '[Auth Login] User logged in');
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    logger.error({ err }, '[Auth Login] Login failed');
    res.status(500).json({ error: 'Login failed due to server error.' });
  }
});

// Logout (client-side token discard; server logs the event for auditing)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  logger.info({ userId: req.user.id, username: req.user.username }, '[Auth Logout] User logged out');
  res.json({ message: 'Logged out successfully.' });
});

// Get profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Change Password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || currentPassword.trim().length === 0 || newPassword.trim().length === 0) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.trim().length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.user.id]);
    logger.info({ userId: req.user.id }, '[User Change Password] Password updated successfully');
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    logger.error({ err }, '[User Change Password] Password update failed');
    res.status(500).json({ error: 'Failed to update password due to server error.' });
  }
});



// --------------------------------------------------------------------------
// User State Sync endpoints
// --------------------------------------------------------------------------

// Fetch global state (KPI stats, domain question lists, prep week checklists)
app.get('/api/user/state', authenticateToken, async (req, res) => {
  try {
    const state = await dbGet('SELECT * FROM study_state WHERE user_id = ?', [req.user.id]);
    if (!state) {
      return res.status(404).json({ error: 'State configuration not found.' });
    }

    res.json({
      streak: state.streak,
      lastStudiedDate: state.last_studied_date,
      prepPlan: JSON.parse(state.prep_plan || '[]'),
      domains: JSON.parse(state.domains || '{}'),
      neetcode: JSON.parse(state.neetcode || '[]'),
      companies: JSON.parse(state.companies || '[]'),
      patterns: JSON.parse(state.patterns || '[]')
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[State Fetch] Failed to retrieve study state');
    res.status(500).json({ error: 'Failed to retrieve study configs.' });
  }
});

// Update global state
app.post('/api/user/state', authenticateToken, async (req, res) => {
  const { streak, lastStudiedDate, prepPlan, domains, neetcode, companies, patterns } = req.body;

  try {
    await dbRun(
      `UPDATE study_state SET 
        streak = ?, 
        last_studied_date = ?, 
        prep_plan = ?, 
        domains = ?, 
        neetcode = ?, 
        companies = ?, 
        patterns = ? 
       WHERE user_id = ?`,
      [
        streak !== undefined ? streak : 0,
        lastStudiedDate || new Date().toISOString().slice(0, 10),
        JSON.stringify(prepPlan || []),
        JSON.stringify(domains || {}),
        JSON.stringify(neetcode || []),
        JSON.stringify(companies || []),
        JSON.stringify(patterns || []),
        req.user.id
      ]
    );
    res.json({ message: 'Study state synchronised successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[State Update] Failed to sync study state');
    res.status(500).json({ error: 'Failed to sync study state changes.' });
  }
});

// Granular Sync PATCH Routes:
// PATCH streak
app.patch('/api/user/state/streak', authenticateToken, async (req, res) => {
  const { streak, lastStudiedDate } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET streak = ?, last_studied_date = ? WHERE user_id = ?`,
      [
        streak !== undefined ? streak : 0,
        lastStudiedDate || new Date().toISOString().slice(0, 10),
        req.user.id
      ]
    );
    res.json({ message: 'Streak synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Streak Update] Failed to sync streak');
    res.status(500).json({ error: 'Failed to sync streak.' });
  }
});

// PATCH prep-plan
app.patch('/api/user/state/prep-plan', authenticateToken, async (req, res) => {
  const { prepPlan } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET prep_plan = ? WHERE user_id = ?`,
      [JSON.stringify(prepPlan || []), req.user.id]
    );
    res.json({ message: 'Prep plan synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[PrepPlan Update] Failed to sync prep plan');
    res.status(500).json({ error: 'Failed to sync prep plan.' });
  }
});

// PATCH domains
app.patch('/api/user/state/domains', authenticateToken, async (req, res) => {
  const { domains } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET domains = ? WHERE user_id = ?`,
      [JSON.stringify(domains || {}), req.user.id]
    );
    res.json({ message: 'Domains synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Domains Update] Failed to sync domains');
    res.status(500).json({ error: 'Failed to sync domains.' });
  }
});

// PATCH neetcode
app.patch('/api/user/state/neetcode', authenticateToken, async (req, res) => {
  const { neetcode } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET neetcode = ? WHERE user_id = ?`,
      [JSON.stringify(neetcode || []), req.user.id]
    );
    res.json({ message: 'Leetcode problems synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Neetcode Update] Failed to sync neetcode problems');
    res.status(500).json({ error: 'Failed to sync Leetcode problems.' });
  }
});

// PATCH companies
app.patch('/api/user/state/companies', authenticateToken, async (req, res) => {
  const { companies } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET companies = ? WHERE user_id = ?`,
      [JSON.stringify(companies || []), req.user.id]
    );
    res.json({ message: 'Company profiles synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Companies Update] Failed to sync company profiles');
    res.status(500).json({ error: 'Failed to sync company profiles.' });
  }
});

// PATCH patterns
app.patch('/api/user/state/patterns', authenticateToken, async (req, res) => {
  const { patterns } = req.body;
  try {
    await dbRun(
      `UPDATE study_state SET patterns = ? WHERE user_id = ?`,
      [JSON.stringify(patterns || []), req.user.id]
    );
    res.json({ message: 'Blueprints synchronized successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Patterns Update] Failed to sync blueprints');
    res.status(500).json({ error: 'Failed to sync blueprints.' });
  }
});


// --------------------------------------------------------------------------
// Notebook Tree Outlines endpoints
// --------------------------------------------------------------------------

// Fetch notebook outline tree
app.get('/api/notebook/tree', authenticateToken, async (req, res) => {
  try {
    const pages = await dbAll('SELECT * FROM notebook_pages WHERE user_id = ? ORDER BY sort_order ASC', [req.user.id]);
    
    // Map to reconstruct tree
    const pageMap = {};
    const tree = [];

    pages.forEach(p => {
      pageMap[p.id] = { 
        id: p.id,
        title: p.title,
        status: p.status,
        collapsed: !!p.collapsed,
        body: p.body,
        type: p.type || 'file',
        children: [] 
      };
    });

    pages.forEach(p => {
      const node = pageMap[p.id];
      if (p.parent_id) {
        const parent = pageMap[p.parent_id];
        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node); // Orphans fallback to root
        }
      } else {
        tree.push(node);
      }
    });

    res.json({ notebookTree: tree });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Notebook Tree] Failed to build tree');
    res.status(500).json({ error: 'Failed to build notebook outlines tree.' });
  }
});

// Create/Update a Note Page Node
app.post('/api/notebook/page', authenticateToken, async (req, res) => {
  const { id, parent_id, title, body, status, collapsed, sort_order, type } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: 'Page ID and title are required fields.' });
  }

  try {
    await dbRun(
      `INSERT INTO notebook_pages (id, user_id, parent_id, title, body, status, collapsed, sort_order, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         parent_id = excluded.parent_id,
         title = excluded.title,
         body = excluded.body,
         status = excluded.status,
         collapsed = excluded.collapsed,
         sort_order = excluded.sort_order,
         type = excluded.type`,
      [
        id,
        req.user.id,
        parent_id || null,
        title,
        body !== undefined ? body : '<p>Start writing your notes here...</p>',
        status || 'todo',
        collapsed ? 1 : 0,
        sort_order || 0,
        type || 'file'
      ]
    );
    res.json({ message: 'Notebook page updated successfully.' });
  } catch (err) {
    logger.error({ err, userId: req.user.id }, '[Notebook Page Save] Failed to save page');
    res.status(500).json({ error: 'Failed to save notebook page details.' });
  }
});

// Recursive helper to delete notes and nested pages in DB
const deleteNoteNodeRecursive = async (userId, noteId) => {
  const children = await dbAll('SELECT id FROM notebook_pages WHERE user_id = ? AND parent_id = ?', [userId, noteId]);
  for (const child of children) {
    await deleteNoteNodeRecursive(userId, child.id);
  }
  await dbRun('DELETE FROM notebook_pages WHERE user_id = ? AND id = ?', [userId, noteId]);
};

// Delete Page Node
app.delete('/api/notebook/page/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const page = await dbGet('SELECT * FROM notebook_pages WHERE user_id = ? AND id = ?', [req.user.id, id]);
    if (!page) {
      return res.status(404).json({ error: 'Page node not found or unauthorised.' });
    }

    await dbRun('BEGIN TRANSACTION');
    await deleteNoteNodeRecursive(req.user.id, id);
    await dbRun('COMMIT');
    res.json({ message: 'Notebook page and nested children deleted recursively.' });
  } catch (err) {
    try {
      await dbRun('ROLLBACK');
    } catch (rbErr) {}
    logger.error({ err, userId: req.user.id, pageId: id }, '[Notebook Page Delete] Failed to delete page');
    res.status(500).json({ error: 'Failed to delete notebook pages recursively.' });
  }
});

// Import backup tree (50mb limit scoped here for large base64 image imports)
app.post('/api/notebook/import', authenticateToken, express.json({ limit: '50mb' }), async (req, res) => {
  const { notebookTree } = req.body;
  if (!Array.isArray(notebookTree)) {
    return res.status(400).json({ error: 'Invalid notebook backup schema format.' });
  }

  // Fix #12: depth limit + per-node field caps to prevent stack overflow / storage abuse
  const MAX_DEPTH = 10;
  const MAX_TITLE_LEN = 200;
  const MAX_BODY_BYTES = 500 * 1024; // 500 KB per node

  const validateTree = (nodes, depth = 0) => {
    if (depth > MAX_DEPTH) throw new Error(`Tree exceeds max depth of ${MAX_DEPTH}`);
    for (const n of nodes) {
      if (!n.id || typeof n.id !== 'string') throw new Error('Node missing valid id');
      if (typeof n.title === 'string' && n.title.length > MAX_TITLE_LEN)
        throw new Error(`Node title exceeds ${MAX_TITLE_LEN} characters`);
      if (typeof n.body === 'string' && Buffer.byteLength(n.body, 'utf8') > MAX_BODY_BYTES)
        throw new Error('Node body exceeds 500KB limit');
      if (n.type && typeof n.type !== 'string')
        throw new Error('Node type must be a string');
      if (n.children && Array.isArray(n.children))
        validateTree(n.children, depth + 1);
    }
  };

  try {
    validateTree(notebookTree);

    await dbRun('BEGIN TRANSACTION');

    // Clear existing pages
    await dbRun('DELETE FROM notebook_pages WHERE user_id = ?', [req.user.id]);

    // Iterative BFS insertion — no unbounded recursion (Fix #12)
    const queue = notebookTree.map((n, i) => ({ node: n, parentId: null, order: i }));
    while (queue.length > 0) {
      const { node: n, parentId, order } = queue.shift();
      await dbRun(
        `INSERT INTO notebook_pages (id, user_id, parent_id, title, body, status, collapsed, sort_order, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [n.id, req.user.id, parentId, n.title, n.body || '', n.status || 'todo', n.collapsed ? 1 : 0, order, n.type || 'file']
      );
      if (n.children && n.children.length > 0) {
        n.children.forEach((child, i) => queue.push({ node: child, parentId: n.id, order: i }));
      }
    }

    await dbRun('COMMIT');
    res.json({ message: 'Notebook restored successfully.' });
  } catch (err) {
    try {
      await dbRun('ROLLBACK');
    } catch (rbErr) {}
    const isValidationErr = err.message.includes('exceeds') || err.message.startsWith('Tree exceeds') || err.message.includes('missing');
    logger.error({ err, userId: req.user.id }, '[Notebook Restore] Import failed');
    res.status(isValidationErr ? 400 : 500).json({
      error: 'Failed to restore notebook backup.',
      detail: IS_PROD ? undefined : err.message
    });
  }
});

// Reorder or save full notebook pages tree outline sort array sequentially
app.post('/api/notebook/reorder', authenticateToken, async (req, res) => {
  const { reorderedNodes } = req.body; // Expect flat map: { id, parent_id, sort_order }[]
  
  if (!Array.isArray(reorderedNodes)) {
    return res.status(400).json({ error: 'Invalid reorder array payload.' });
  }

  try {
    await dbRun('BEGIN TRANSACTION');
    for (const item of reorderedNodes) {
      await dbRun(
        'UPDATE notebook_pages SET parent_id = ?, sort_order = ? WHERE user_id = ? AND id = ?',
        [item.parent_id || null, item.sort_order, req.user.id, item.id]
      );
    }
    await dbRun('COMMIT');
    res.json({ message: 'Outline tree reordered successfully.' });
  } catch (err) {
    try {
      await dbRun('ROLLBACK');
    } catch (rbErr) {}
    logger.error({ err, userId: req.user.id }, '[Notebook Reorder] Failed to reorder pages');
    res.status(500).json({ error: 'Failed to save node order sequence.' });
  }
});

// Client log ingestion endpoint
app.post('/api/logs/client', (req, res) => {
  const { error, info } = req.body;
  logger.error({ clientError: error, clientInfo: info }, '[Client Error] React render boundary caught error');
  res.sendStatus(204);
});


// ── Global Express error handler (catches next(err) from any route) ───────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error({ err, url: req.url, method: req.method }, '[Server] Unhandled route error');
  res.status(500).json({ error: IS_PROD ? 'Internal server error.' : err.message });
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, '[Server] PrepHQ backend running');
    });
  })
  .catch((err) => {
    logger.fatal({ err }, '[Server] Database initialisation failed — shutting down');
    process.exit(1);
  });
