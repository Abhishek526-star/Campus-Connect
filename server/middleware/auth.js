import User from '../models/user.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { unauthorized } from '../utils/ApiError.js';

/**
 * Authentication middleware — verifies the Bearer access token, loads the user,
 * and attaches them to req.user. Enforces account state (active/approved).
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Authentication required', 'NO_ACCESS_TOKEN');
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select(
      'name email role avatar phone isVerified isApproved isActive badges reputationScore privacy',
    );

    if (!user) throw unauthorized('Account no longer exists', 'USER_NOT_FOUND');
    if (!user.isActive) throw unauthorized('This account has been deactivated', 'ACCOUNT_DISABLED');
    if (!user.isVerified) throw unauthorized('Please verify your email first', 'EMAIL_NOT_VERIFIED');
    if (!user.isApproved) throw unauthorized('Your account is pending admin approval', 'ACCOUNT_PENDING_APPROVAL');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
