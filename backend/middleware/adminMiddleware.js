const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }

  return next();
};

export default adminMiddleware;
