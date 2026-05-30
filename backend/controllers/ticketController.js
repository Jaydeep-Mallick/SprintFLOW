import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { logActivity, createNotification } from '../utils/helpers.js';

// @desc    Get support tickets based on role
// @route   GET /api/tickets
// @access  Private (Admin & Client)
export const getTickets = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'Client') {
      query.client = req.user._id;
    }

    const tickets = await Ticket.find(query)
      .populate('client', 'name email')
      .populate('assignedAdmin', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket details
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('client', 'name email')
      .populate('assignedAdmin', 'name email')
      .populate('comments.author', 'name email role');

    if (!ticket) {
      res.status(404);
      throw new Error('Support ticket not found');
    }

    // Auth check
    if (req.user.role === 'Client' && ticket.client._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not authorized to view this ticket');
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    Create support ticket
// @route   POST /api/tickets
// @access  Private (Client only)
export const createTicket = async (req, res, next) => {
  const { title, description, category, priority } = req.body;

  try {
    if (req.user.role !== 'Client') {
      res.status(403);
      throw new Error('Only clients can raise support tickets');
    }

    const ticket = await Ticket.create({
      client: req.user._id,
      title,
      description,
      category,
      priority: priority || 'Medium',
      status: 'Open',
    });

    // Notify all admins about the new ticket
    const admins = await User.find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        title: 'New Support Ticket Raised',
        message: `Client "${req.user.name}" created ticket: "${title}" (Category: ${category}).`,
        type: 'TicketCreated',
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status / assignment
// @route   PUT /api/tickets/:id
// @access  Private (Admin & Client)
export const updateTicket = async (req, res, next) => {
  const { status, assignedAdmin } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      throw new Error('Support ticket not found');
    }

    // Client can only update status (e.g. close the ticket)
    if (req.user.role === 'Client') {
      if (status && ['Closed'].includes(status)) {
        ticket.status = status;
      } else {
        res.status(403);
        throw new Error('Clients can only set ticket status to "Closed"');
      }
    }

    // Admin can update status and assignment
    if (req.user.role === 'Admin') {
      if (status) ticket.status = status;
      if (assignedAdmin !== undefined) ticket.assignedAdmin = assignedAdmin || null;
    }

    const updatedTicket = await ticket.save();

    // Notify client if resolved
    if (status === 'Resolved') {
      await createNotification({
        user: ticket.client,
        title: 'Support Ticket Resolved',
        message: `Your ticket "${ticket.title}" has been marked as Resolved.`,
        type: 'TicketResolved',
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to ticket discussion
// @route   POST /api/tickets/:id/comments
// @access  Private (Admin & Client)
export const addTicketComment = async (req, res, next) => {
  const { content } = req.body;

  try {
    if (!content) {
      res.status(400);
      throw new Error('Comment content is required');
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      throw new Error('Support ticket not found');
    }

    // Auth check
    if (req.user.role === 'Client' && ticket.client.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You can only comment on your own tickets');
    }

    ticket.comments.push({
      author: req.user._id,
      content,
    });

    await ticket.save();

    // Send notifications
    if (req.user.role === 'Client' && ticket.assignedAdmin) {
      await createNotification({
        user: ticket.assignedAdmin,
        title: 'New Ticket Update',
        message: `Client "${req.user.name}" commented on ticket "${ticket.title}".`,
        type: 'TicketCommentAdded',
      });
    } else if (req.user.role === 'Admin') {
      await createNotification({
        user: ticket.client,
        title: 'Support Response Received',
        message: `Admin "${req.user.name}" commented on your ticket "${ticket.title}".`,
        type: 'TicketCommentAdded',
      });
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('client', 'name email')
      .populate('assignedAdmin', 'name email')
      .populate('comments.author', 'name email role');

    res.json(populatedTicket);
  } catch (error) {
    next(error);
  }
};
