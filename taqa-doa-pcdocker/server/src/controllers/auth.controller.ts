import { Request, Response, NextFunction } from 'express';
import { findOrCreateUser, getUserByOid } from '../services/user.service';
import { UnauthorizedError } from '../middleware/errorHandler';

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me
// ---------------------------------------------------------------------------
/**
 * Returns the current user's profile. If the user doesn't exist in the DB
 * yet, auto-provisions them (first-login flow).
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await findOrCreateUser({
      azureOid: req.user.oid,
      email: req.user.email,
      displayName: req.user.displayName,
    });

    // Check if user is deactivated
    if (!user.is_active) {
      throw new UnauthorizedError('Your account has been deactivated. Contact an administrator.');
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/auth/role
// ---------------------------------------------------------------------------
/**
 * Returns just the user's role. Useful for quick permission checks on
 * the frontend without fetching the full profile.
 */
export async function getRole(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await getUserByOid(req.user.oid);
    if (!user) {
      // User hasn't hit /me yet — they're a new viewer
      res.json({ role: 'viewer' });
      return;
    }

    res.json({ role: user.role });
  } catch (error) {
    next(error);
  }
}
