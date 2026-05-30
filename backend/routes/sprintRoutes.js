import express from 'express';
import {
  getSprintsByProject,
  getSprintById,
  createSprint,
  updateSprint,
  getSprintAnalytics,
} from '../controllers/sprintController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', requireRole(['Admin']), createSprint);
router.route('/:id')
  .get(getSprintById)
  .put(requireRole(['Admin']), updateSprint);

router.get('/project/:projectId', getSprintsByProject);
router.get('/:id/analytics', getSprintAnalytics);

export default router;
