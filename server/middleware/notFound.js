/**
 * 404 handler for unmatched API routes (spec §33 envelope).
 */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: { code: 'NOT_FOUND' },
  });
}
