import express from 'express';
import {
  logHours,
  getMyTimesheets,
  getAdminTimesheetReports,
} from '../controllers/timesheetController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', requireRole(['Developer']), logHours);
router.get('/my', requireRole(['Developer']), getMyTimesheets);
router.get('/admin/summary', requireRole(['Admin']), getAdminTimesheetReports);

export default router;
