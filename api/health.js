import { getApimartEnv, methodNotAllowed, sendJson } from './_utils.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const { key, base } = getApimartEnv();
  return sendJson(res, 200, { ok: true, hasKey: !!key, base });
}
