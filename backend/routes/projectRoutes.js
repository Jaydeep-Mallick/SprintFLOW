import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(requireRole(['Admin', 'Client']), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(requireRole(['Admin']), updateProject)
  .delete(requireRole(['Admin']), deleteProject);

router.put('/:id/archive', requireRole(['Admin']), archiveProject);

export default router;
