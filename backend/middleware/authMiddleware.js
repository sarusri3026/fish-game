const jwt = require('jsonwebtoken');

/**
 * Auth Middleware - Protects routes by verifying JWT virtual identity
 * Theme 4: Virtual Identity & Security
 *
 * Rules:
 * - Fails safely if JWT_SECRET is missing.
 * - Extracts and cryptographically verifies the Bearer token.
 * - Never trusts unverified or expired tokens.
 */
const verifyToken = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Server security configuration error: JWT_SECRET is not set.'
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach verified virtual identity to request
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

/**
 * Optional Auth Middleware - Inspects token if provided, but allows guest players to proceed
 */
const optionalToken = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  const authHeader = req.headers.authorization;

  if (secret && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
    } catch (err) {
      // Allow guest execution without attached identity
    }
  }
  next();
};

module.exports = { verifyToken, optionalToken };
