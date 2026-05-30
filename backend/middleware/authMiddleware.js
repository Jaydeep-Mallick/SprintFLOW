import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import admin from '../config/firebaseAdmin.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 1. Try local custom JWT verification first (fallback mode)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sprintflowsecretkey');
        req.user = await User.findById(decoded.id).select('-password');
        if (req.user) {
          return next();
        }
      } catch (jwtError) {
        // If local custom JWT verification fails, proceed to Firebase verification
      }

      // 2. Try Firebase ID Token verification
      try {
        const decoded = await admin.auth().verifyIdToken(token);

        // Find user in MongoDB using decoded.uid if it's a valid ObjectId, otherwise fall back to email
        let user = null;
        if (decoded.uid && mongoose.Types.ObjectId.isValid(decoded.uid)) {
          user = await User.findById(decoded.uid);
        }
        if (!user && decoded.email) {
          user = await User.findOne({ email: decoded.email });
        }

        // Auto-register the user if they don't exist yet (e.g. social login)
        if (!user && decoded.email) {
          const generatedPassword = crypto.randomBytes(16).toString('hex');
          user = await User.create({
            name: decoded.name || decoded.email.split('@')[0],
            email: decoded.email,
            password: generatedPassword,
            role: 'Admin', // Default role for self-registered users (Admin for testing)
          });
          console.log(`👤 Auto-registered new Firebase/Google user: ${user.name} (${user.email}) as Admin`);
        } else if (user && decoded.name && user.name !== decoded.name) {
          // Sync name with Gmail/Firebase display name if it changed
          user.name = decoded.name;
          await user.save();
        }

        req.user = user;

        if (req.user) {
          return next();
        }
      } catch (fbError) {
        // Log error only if both verifications fail
        console.warn('Firebase token verification failed:', fbError.message);
      }

      return res.status(401).json({ message: 'Not authorized, token verification failed' });
    } catch (error) {
      console.error('Auth protect middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
};
