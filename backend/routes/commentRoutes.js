import express from 'express';
import {
  getCommentsByTask,
  createComment,
  addReply,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createComment);
router.get('/task/:taskId', getCommentsByTask);
router.post('/:id/reply', addReply);

export default router;
