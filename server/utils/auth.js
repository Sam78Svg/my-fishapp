import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

let developmentSecret;
function getTokenSecret() {
    if (process.env.AUTH_TOKEN_SECRET) return process.env.AUTH_TOKEN_SECRET;
    if (process.env.NODE_ENV === 'production') return null;
    developmentSecret ??= randomBytes(32).toString('hex');
    return developmentSecret;
}

export function createAuthToken(user) {
    const tokenSecret = getTokenSecret();
    if (!tokenSecret) throw new Error('AUTH_TOKEN_SECRET must be configured in production');
    const payload = Buffer.from(JSON.stringify({
        sub: user.type === 'admin' ? user.username : user.name,
        role: user.type,
        company_name: user.company_name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    })).toString('base64url');
    const signature = createHmac('sha256', tokenSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

export function authenticate(req, res, next) {
    const tokenSecret = getTokenSecret();
    if (!tokenSecret) return res.status(503).json({ message: 'Authentication is not configured' });
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication required' });

    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return res.status(401).json({ message: 'Invalid authentication token' });
    const expected = createHmac('sha256', tokenSecret).update(payload).digest();
    let provided;
    try { provided = Buffer.from(signature, 'base64url'); } catch { return res.status(401).json({ message: 'Invalid authentication token' }); }
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return res.status(401).json({ message: 'Invalid authentication token' });
    }

    try {
        const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!user.sub || !['admin', 'employee'].includes(user.role) || !Number.isInteger(user.exp) || user.exp <= Date.now() / 1000) {
            return res.status(401).json({ message: 'Invalid or expired authentication token' });
        }
        req.auth = user;
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid authentication token' });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => roles.includes(req.auth?.role)
        ? next()
        : res.status(403).json({ message: 'Insufficient permissions' });
}
