import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Create a server/.env file from server/.env.example and restart.');
  process.exit(1);
}

/**
 * Middleware to authenticate requests via JWT tokens.
 * Extracts JWT token from the Authorization header and appends user to request.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expecting header format: 'Bearer TOKEN'
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token not provided. Please authenticate.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    
    // user contains { id, username }
    req.user = user;
    next();
  });
};

/**
 * Generates a standard 30-day JWT login token for a user.
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
