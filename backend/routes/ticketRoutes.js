import express from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketComment,
} from '../controllers/ticketController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(requireRole(['Admin', 'Client']), getTickets)
  .post(requireRole(['Client']), createTicket);

router.route('/:id')
  .get(requireRole(['Admin', 'Client']), getTicketById)
  .put(requireRole(['Admin', 'Client']), updateTicket);

router.post('/:id/comments', requireRole(['Admin', 'Client']), addTicketComment);

export default router;
