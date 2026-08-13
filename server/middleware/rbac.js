import { forbidden } from '../utils/ApiError.js';

/**
 * Role-based access control middleware (spec §21).
 * Usage: router.get('/', requireRole('admin'), handler)
 * Multiple roles are allowed: requireRole('admin', 'faculty')
 */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(forbidden('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(forbidden(`This action requires role: ${roles.join(' or ')}`));
    }
    next();
  };

/** Alias for clarity on admin-only routes. */
export const requireAdmin = requireRole('admin');

/**
 * Self-or-role guard: allows the resource owner (req.params.id) or any listed role.
 * Usage: requireSelfOr('admin', 'faculty')
 */
export const requireSelfOr =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(forbidden('Authentication required'));
    const isSelf = req.params.id && req.params.id === req.user._id.toString();
    if (isSelf || roles.includes(req.user.role)) return next();
    next(forbidden('You can only manage your own resources'));
  };
