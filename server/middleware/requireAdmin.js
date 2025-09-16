// Placeholder admin authentication middleware
module.exports = function requireAdmin(req, res, next) {
  // In production, verify a JWT and role here
  const isAdminHeader = req.header('x-admin');
  if (!isAdminHeader) {
    return res.status(401).json({ error: { message: 'Unauthorized: admin token missing' } });
  }
  if (String(isAdminHeader).toLowerCase() !== 'true') {
    return res.status(403).json({ error: { message: 'Forbidden: admin access required' } });
  }
  next();
};
