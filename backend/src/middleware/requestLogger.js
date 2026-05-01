export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? 31 : res.statusCode >= 400 ? 33 : 32;
    console.log(`\x1b[${color}m${res.statusCode}\x1b[0m ${req.method} ${req.path} ${ms}ms`);
  });
  next();
}
