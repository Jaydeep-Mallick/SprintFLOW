import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(requireRole(['Admin']), createTask);

router.route('/:id')
  .get(getTaskById)
  .put(requireRole(['Admin', 'Developer']), updateTask)
  .delete(requireRole(['Admin']), deleteTask);

export default router;
