import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { logActivity, createNotification } from '../utils/helpers.js';

// @desc    Get comments for a task
// @route   GET /api/comments/task/:taskId
// @access  Private
export const getCommentsByTask = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email role')
      .populate('replies.author', 'name email role')
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req, res, next) => {
  const { task: taskId, content } = req.body;

  try {
    if (!content) {
      res.status(400);
      throw new Error('Comment content is required');
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email role');

    await logActivity({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'Comment Added',
      details: `Added comment to task "${task.title}": "${content.substring(0, 30)}..."`,
    });

    // Notify other stakeholders (e.g. developer or project client)
    if (task.assignedDeveloper && task.assignedDeveloper.toString() !== req.user._id.toString()) {
      await createNotification({
        user: task.assignedDeveloper,
        title: 'New Comment',
        message: `${req.user.name} commented on "${task.title}".`,
        type: 'CommentAdded',
      });
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a reply to a comment
// @route   POST /api/comments/:id/reply
// @access  Private
export const addReply = async (req, res, next) => {
  const { content } = req.body;

  try {
    if (!content) {
      res.status(400);
      throw new Error('Reply content is required');
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }

    comment.replies.push({
      author: req.user._id,
      content,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email role')
      .populate('replies.author', 'name email role');

    const task = await Task.findById(comment.task);
    if (task) {
      await logActivity({
        project: task.project,
        task: task._id,
        user: req.user._id,
        action: 'Comment Added',
        details: `Replied to a comment on task "${task.title}".`,
      });
    }

    res.json(populatedComment);
  } catch (error) {
    next(error);
  }
};
