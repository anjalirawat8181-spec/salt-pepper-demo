import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';

import authMiddleware from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { hashPasswordForStorage, verifyPassword } from '../utils/password.js';

const router = express.Router();

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'development-secret',
    { expiresIn: '8h' }
  );

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Name, email, password, and confirm password are required.' });
    }

    if (password.length < 8 || password !== confirmPassword) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and match confirmation.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPasswordForStorage(password, salt);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword.passwordHash,
      passwordSalt: hashedPassword.passwordSalt,
      passwordVersion: hashedPassword.passwordVersion,
      role: 'user',
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await verifyPassword(password, user.passwordHash, user.passwordSalt);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = generateToken({ _id: user._id, email: user.email, role: user.role });

    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load user profile.' });
  }
});

router.post('/logout', (req, res) => {
  return res.json({ message: 'Logout successful.' });
});

export default router;
