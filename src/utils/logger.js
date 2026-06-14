/**
 * logger.js — PrepHQ frontend logger utility
 *
 * Thin wrapper over the browser console with consistent prefixes and
 * environment-aware verbosity:
 *   - Development : debug + info + warn + error all output
 *   - Production  : only warn + error output (debug/info are silenced)
 *
 * API mirrors a standard structured logger:
 *   logger.debug('Loading user state', { userId })
 *   logger.info('Domain added', { domain })
 *   logger.warn('Token rejected — clearing session')
 *   logger.error('Backend sync failed', { err })
 *
 * Swap out the internals here (e.g., add Sentry) without touching call-sites.
 */

const IS_DEV = import.meta.env.DEV;

const fmt = (level, msg, ctx) => {
  const parts = [`[PrepHQ ${level}]`, msg];
  if (ctx !== undefined) parts.push(ctx);
  return parts;
};

const logger = {
  debug: (msg, ctx) => {
    if (IS_DEV) console.debug(...fmt('DEBUG', msg, ctx));
  },
  info: (msg, ctx) => {
    if (IS_DEV) console.info(...fmt('INFO ', msg, ctx));
  },
  warn: (msg, ctx) => {
    console.warn(...fmt('WARN ', msg, ctx));
  },
  error: (msg, ctx) => {
    console.error(...fmt('ERROR', msg, ctx));
  },
};

export default logger;
