/**
 * logger.js — PrepHQ structured logger
 *
 * Outputs to two destinations simultaneously:
 *   1. server/logs/app.log  — rotates at 50 MB, gzip-compressed archives kept
 *   2. Terminal (stdout)    — pino-pretty (coloured) in dev, plain JSON in prod
 *
 * Usage:
 *   import logger from './logger.js';
 *   logger.info('Server started', { port: 5001 });
 *   logger.error('DB failure', { err });
 *
 * Log levels (lowest → highest): trace | debug | info | warn | error | fatal
 * Set LOG_LEVEL env variable to override the minimum level (default: 'info').
 */

import pino from 'pino';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_PROD    = process.env.NODE_ENV === 'production';
const LOG_LEVEL  = process.env.LOG_LEVEL || 'info';
const LOG_FILE   = resolve(__dirname, 'logs', 'app.log');

// ── pino transport (runs in worker threads, non-blocking) ──────────────────
const transport = pino.transport({
  targets: [
    // ① Rotating file — captures debug+ always, rotates at 50 MB
    {
      target : 'pino-roll',
      level  : 'debug',
      options: {
        file : LOG_FILE,
        size : '50m',   // rotate when file exceeds 50 MB
        mkdir: true,    // create logs/ directory if it doesn't exist
      },
    },

    // ② Terminal — pretty-printed in dev, compact JSON in prod
    IS_PROD
      ? {
          target : 'pino/file',
          level  : LOG_LEVEL,
          options: { destination: 1 }, // fd 1 = stdout
        }
      : {
          target : 'pino-pretty',
          level  : 'debug',
          options: {
            colorize         : true,
            translateTime    : 'HH:MM:ss.l',
            ignore           : 'pid,hostname',
            messageFormat    : '{msg}',
            singleLine       : false,
          },
        },
  ],
});

const logger = pino(
  {
    level    : 'debug', // transport targets control their own minimum level
    timestamp: pino.stdTimeFunctions.isoTime,
    base     : { service: 'prephq-backend' },
  },
  transport,
);

export default logger;
