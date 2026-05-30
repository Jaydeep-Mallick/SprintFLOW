import User from '../models/User.js';
import admin from '../config/firebaseAdmin.js';

// @desc    Get all developers
// @route   GET /api/users/developers
// @access  Private (Admin & Developer)
export const getDevelopers = async (req, res, next) => {
  try {
    const developers = await User.find({ role: 'Developer' }).select('-password');
    res.json(developers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all clients
// @route   GET /api/users/clients
// @access  Private (Admin)
export const getClients = async (req, res, next) => {
  try {
    const clients = await User.find({ role: 'Client' }).select('-password');
    res.json(clients);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // 1. Create locally in MongoDB
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // 2. Create in Firebase Auth with the same ObjectId as Firebase uid
    try {
      await admin.auth().createUser({
        uid: user._id.toString(),
        email: user.email,
        password: password,
        displayName: user.name,
      });
    } catch (fbError) {
      // Rollback local user creation to keep DBs in sync
      await User.deleteOne({ _id: user._id });
      throw fbError;
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const originalEmail = user.email;
      
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      // 1. Sync updates to Firebase Auth
      const updateData = {};
      if (req.body.name) updateData.displayName = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.password) updateData.password = req.body.password;

      if (Object.keys(updateData).length > 0) {
        try {
          await admin.auth().updateUser(user._id.toString(), updateData);
        } catch (fbError) {
          // If user doesn't exist in Firebase yet, create them to self-heal
          if (fbError.code === 'auth/user-not-found') {
            await admin.auth().createUser({
              uid: user._id.toString(),
              email: user.email,
              password: req.body.password || 'tempPass123!',
              displayName: user.name,
            });
          } else {
            throw fbError;
          }
        }
      }

      // 2. Save locally in MongoDB
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // 1. Delete from Firebase Auth
      try {
        await admin.auth().deleteUser(user._id.toString());
      } catch (fbError) {
        // Log the error but don't block DB deletion if they are already missing from Firebase
        console.warn(`User ${user._id} not found in Firebase Auth during deletion:`, fbError.message);
      }

      // 2. Delete from MongoDB
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
