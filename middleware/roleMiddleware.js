// backend/middleware/roleMiddleware.js

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // protect middleware should already have attached user to req
      if (!req.user) {
        return res.status(401).json({
          message: 'Not authorized. Please log in.',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);

      return res.status(500).json({
        message: 'Server error',
      });
    }
  };
};

module.exports = authorizeRoles;