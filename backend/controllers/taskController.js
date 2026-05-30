import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { logActivity, createNotification } from '../utils/helpers.js';

// @desc    Get all tasks with optional filters
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { project, sprint, status, priority, assignedDeveloper } = req.query;
    let query = {};

    // Build filters
    if (project) query.project = project;
    if (sprint) query.sprint = sprint === 'null' ? null : sprint;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedDeveloper) query.assignedDeveloper = assignedDeveloper === 'null' ? null : assignedDeveloper;

    // Role-based visibility enforcement
    if (req.user.role === 'Developer') {
      // Find projects the developer belongs to
      const devProjects = await Project.find({ assignedTeam: req.user._id, archived: false }).select('_id');
      const devProjectIds = devProjects.map(p => p._id);
      
      // Developer can see tasks inside projects they belong to
      query.project = { $in: devProjectIds };
      if (project && !devProjectIds.some(id => id.toString() === project)) {
        // If developer filtered by a project they don't belong to, force empty result
        return res.json([]);
      }
    } else if (req.user.role === 'Client') {
      // Client can only see tasks of their projects
      const clientProjects = await Project.find({ client: req.user._id, archived: false }).select('_id');
      const clientProjectIds = clientProjects.map(p => p._id);

      query.project = { $in: clientProjectIds };
      if (project && !clientProjectIds.some(id => id.toString() === project)) {
        return res.json([]);
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedDeveloper', 'name email role')
      .populate('project', 'name client')
      .populate('sprint', 'name status');

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Get task details
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedDeveloper', 'name email role')
      .populate('project', 'name client')
      .populate('sprint', 'name status');

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private (Admin only)
export const createTask = async (req, res, next) => {
  const { title, description, assignedDeveloper, project, sprint, priority, status, deadline, estimatedHours } = req.body;

  try {
    const task = await Task.create({
      title,
      description,
      assignedDeveloper: assignedDeveloper || null,
      project,
      sprint: sprint || null,
      priority: priority || 'Medium',
      status: status || 'Backlog',
      deadline,
      estimatedHours,
    });

    await logActivity({
      project,
      task: task._id,
      sprint: sprint || null,
      user: req.user._id,
      action: 'Task Created',
      details: `Task "${title}" was created and initialized.`,
    });

    if (assignedDeveloper) {
      await createNotification({
        user: assignedDeveloper,
        title: 'New Task Assigned',
        message: `You have been assigned the task: "${title}".`,
        type: 'TaskAssigned',
      });
      await logActivity({
        project,
        task: task._id,
        sprint: sprint || null,
        user: req.user._id,
        action: 'Task Assigned',
        details: `Assigned task "${title}" to developer.`,
      });
    }

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (status, assign, details, actualHours)
// @route   PUT /api/tasks/:id
// @access  Private (Admin & Developer)
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const isDeveloper = req.user.role === 'Developer';
    const isClient = req.user.role === 'Client';

    if (isClient) {
      res.status(403);
      throw new Error('Clients are not authorized to update tasks.');
    }

    const previousStatus = task.status;
    const previousDeveloper = task.assignedDeveloper ? task.assignedDeveloper.toString() : null;

    if (isDeveloper) {
      // Developers can only update: status, actualHours
      task.status = req.body.status !== undefined ? req.body.status : task.status;
      task.actualHours = req.body.actualHours !== undefined ? req.body.actualHours : task.actualHours;
    } else {
      // Admins can update everything
      task.title = req.body.title || task.title;
      task.description = req.body.description || task.description;
      task.assignedDeveloper = req.body.assignedDeveloper !== undefined ? req.body.assignedDeveloper : task.assignedDeveloper;
      task.sprint = req.body.sprint !== undefined ? req.body.sprint : task.sprint;
      task.priority = req.body.priority || task.priority;
      task.status = req.body.status || task.status;
      task.deadline = req.body.deadline || task.deadline;
      task.estimatedHours = req.body.estimatedHours !== undefined ? req.body.estimatedHours : task.estimatedHours;
      task.actualHours = req.body.actualHours !== undefined ? req.body.actualHours : task.actualHours;
    }

    const updatedTask = await task.save();
    
    // Log details & send notifications for changes
    if (previousStatus !== updatedTask.status) {
      await logActivity({
        project: updatedTask.project,
        task: updatedTask._id,
        sprint: updatedTask.sprint,
        user: req.user._id,
        action: 'Status Changed',
        details: `Task status changed from "${previousStatus}" to "${updatedTask.status}" by ${req.user.name}.`,
      });

      // Notify developer if status is set to Done/Review by someone else
      if (updatedTask.status === 'Done') {
        // If developer is assigned, notify them, and notify project client
        const projectObj = await Project.findById(updatedTask.project);
        if (projectObj) {
          await createNotification({
            user: projectObj.client,
            title: 'Task Completed',
            message: `Task "${updatedTask.title}" has been completed.`,
            type: 'TaskCompleted',
          });
        }
      }
    }

    // Trigger Developer assignment notifications
    const newDeveloper = updatedTask.assignedDeveloper ? updatedTask.assignedDeveloper.toString() : null;
    if (newDeveloper !== previousDeveloper) {
      await logActivity({
        project: updatedTask.project,
        task: updatedTask._id,
        sprint: updatedTask.sprint,
        user: req.user._id,
        action: 'Task Reassigned',
        details: `Reassigned task "${updatedTask.title}" to a different developer.`,
      });

      if (newDeveloper) {
        await createNotification({
          user: newDeveloper,
          title: 'Task Assigned',
          message: `You have been assigned the task: "${updatedTask.title}".`,
          type: 'TaskAssigned',
        });
      }
    }

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    await Task.deleteOne({ _id: task._id });

    await logActivity({
      project: task.project,
      user: req.user._id,
      action: 'Task Deleted',
      details: `Task "${task.title}" was deleted.`,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
