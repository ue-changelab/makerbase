export function errorHandler(err, req, res, _next) {
  if (err.code === '23505') return res.status(409).json({ error: 'Record already exists.' });
  if (err.code === '23503') return res.status(409).json({ error: 'Referenced record does not exist.' });
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Invalid or expired token.' });
  console.error({ ts: new Date().toISOString(), method: req.method, path: req.path, err: err.message });
  res.status(err.statusCode ?? 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
}
