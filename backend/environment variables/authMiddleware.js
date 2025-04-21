// backend/authMiddleware.js

const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes by verifying JWT in cookies.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express middleware next function.
 * @returns {void} Calls next middleware or sends an error response if unauthorized.
 */
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(403).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;