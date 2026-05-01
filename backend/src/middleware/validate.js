import { z } from 'zod';
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) return res.status(400).json({ error: 'Validation failed', errors: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
    if (result.data.body) req.body = result.data.body;
    next();
  };
}
