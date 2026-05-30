import express from 'express';
import {
  getDevelopers,
  getClients,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/developers', requireRole(['Admin', 'Developer']), getDevelopers);
router.get('/clients', requireRole(['Admin']), getClients);

router.route('/')
  .get(requireRole(['Admin']), getAllUsers)
  .post(requireRole(['Admin']), createUser);

router.route('/:id')
  .put(requireRole(['Admin']), updateUser)
  .delete(requireRole(['Admin']), deleteUser);

export default router;
