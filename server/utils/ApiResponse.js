/**
 * Standard success envelope (spec §33):
 * { success: true, message, data, meta? }
 */
export function sendSuccess(res, { status = 200, message = 'OK', data = undefined, meta = undefined }) {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}
