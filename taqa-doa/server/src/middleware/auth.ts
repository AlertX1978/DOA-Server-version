import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/environment';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

// ---------------------------------------------------------------------------
// Types added to Express Request
// ---------------------------------------------------------------------------

export interface AuthUser {
  oid: string;           // Azure AD Object ID
  email: string;
  displayName: string;
  roles: string[];       // App roles from Azure AD
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ---------------------------------------------------------------------------
// JWKS client (caches public keys from Azure AD)
// ---------------------------------------------------------------------------

const IS_AUTH_CONFIGURED =
  env.AZURE_TENANT_ID !== 'placeholder' && env.AZURE_CLIENT_ID !== 'placeholder';

let jwksRsaClient: jwksClient.JwksClient | null = null;

if (IS_AUTH_CONFIGURED) {
  jwksRsaClient = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
    cache: true,
    cacheMaxAge: 600000,  // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });
}

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!jwksRsaClient) return reject(new Error('JWKS client not configured'));
    jwksRsaClient.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      const signingKey = key?.getPublicKey();
      if (!signingKey) return reject(new Error('No signing key found'));
      resolve(signingKey);
    });
  });
}

// ---------------------------------------------------------------------------
// JWT verification
// ---------------------------------------------------------------------------

async function verifyToken(token: string): Promise<AuthUser> {
  // Decode header first to get kid for JWKS lookup
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token format');
  }

  const signingKey = await getSigningKey(decoded.header);

  const payload = jwt.verify(token, signingKey, {
    algorithms: ['RS256'],
    audience: `api://${env.AZURE_CLIENT_ID}`,
    issuer: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
  }) as jwt.JwtPayload;

  return {
    oid: payload.oid || payload.sub || '',
    email: payload.preferred_username || payload.upn || payload.email || '',
    displayName: payload.name || payload.preferred_username || 'Unknown',
    roles: (payload.roles as string[]) || [],
  };
}

// ---------------------------------------------------------------------------
// Middleware: Require authentication
// ---------------------------------------------------------------------------

/**
 * Validates the Bearer token from the Authorization header.
 *
 * In development mode (when Azure AD is not configured), this middleware
 * allows requests through with a synthetic dev user, enabling local
 * development without Azure AD setup.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  // --- Dev bypass when Azure AD is not configured ---
  if (!IS_AUTH_CONFIGURED) {
    req.user = {
      oid: 'dev-user-oid',
      email: 'dev@taqa.local',
      displayName: 'Dev User',
      roles: ['admin'],
    };
    return next();
  }

  // --- Production path ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }

  const token = authHeader.slice(7);

  verifyToken(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.error('[auth] Token verification failed:', err.message);
      next(new UnauthorizedError('Invalid or expired token'));
    });
}

// ---------------------------------------------------------------------------
// Middleware: Require admin role
// ---------------------------------------------------------------------------

/**
 * Must be used AFTER requireAuth. Checks that the authenticated user
 * has the 'admin' role (either from Azure AD app roles or from the
 * local users table).
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // In dev mode, the synthetic user already has 'admin' role
  if (!IS_AUTH_CONFIGURED) {
    return next();
  }

  // Check Azure AD roles first — fall through to DB lookup in user service
  if (req.user.roles.includes('Admin') || req.user.roles.includes('admin')) {
    return next();
  }

  // The user controller will also check the DB role; for now, mark as
  // potentially unauthorized — the user service can upgrade this if needed.
  // We store a flag so the controller can check the DB.
  (req as Request & { _checkDbRole?: boolean })._checkDbRole = true;
  next();
}

/**
 * Optional authentication — attaches user if token is present,
 * but allows unauthenticated requests through.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!IS_AUTH_CONFIGURED) {
    req.user = {
      oid: 'dev-user-oid',
      email: 'dev@taqa.local',
      displayName: 'Dev User',
      roles: ['admin'],
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token — continue without user
  }

  const token = authHeader.slice(7);

  verifyToken(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(() => {
      // Invalid token — still allow through without user
      next();
    });
}
