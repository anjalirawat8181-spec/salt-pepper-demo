import express from 'express';

import adminMiddleware from '../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/overview', async (req, res) => {
  try {
    const [totalUsers, admins, regularUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean();

    return res.json({
      totalUsers,
      adminCount: admins,
      userCount: regularUsers,
      recentUsers: recentUsers.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
      authStatus: 'Verified',
      securityModel: 'bcrypt-hmac-sha256-v1',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load admin overview.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const roleFilter = req.query.role;
    const search = String(req.query.search || '').trim();

    const query = {};
    if (roleFilter && roleFilter !== 'all') query.role = roleFilter;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        passwordVersion: user.passwordVersion,
        createdAt: user.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load users.' });
  }
});

router.get('/users/security', async (req, res) => {
  try {
    const users = await User.find().select('name email role passwordHash passwordSalt passwordVersion createdAt').lean();

    return res.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        passwordVersion: user.passwordVersion,
        createdAt: user.createdAt,
      })),
      warning: 'Sensitive authentication metadata is intentionally displayed for this educational demo only.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch security records.' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const healthCheck = await User.db.db.admin().ping();

    return res.json({
      status: 'ok',
      database: 'connected',
      mongoPing: healthCheck,
      authModel: 'JWT bearer tokens',
      hashScheme: 'bcrypt-hmac-sha256-v1',
    });
  } catch (error) {
    return res.status(500).json({ message: 'MongoDB health check failed.' });
  }
});

export default router;
