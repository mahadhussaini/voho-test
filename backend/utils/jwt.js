import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for authenticated user
 */
export const generateToken = (userId, tenantId) => {
  return jwt.sign(
    { userId, tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

