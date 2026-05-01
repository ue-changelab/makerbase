import jwt from 'jsonwebtoken';
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
  try { req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET); next(); }
  catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    res.status(401).json({ error: 'Invalid token' });
  }
}
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin role required' });
    next();
  });
}
export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) { try { req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch {} }
  next();
}
