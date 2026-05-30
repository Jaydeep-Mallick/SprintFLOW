import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import { logActivity } from '../utils/helpers.js';

// @desc    Get all sprints for a project
// @route   GET /api/sprints/project/:projectId
// @access  Private
export const getSprintsByProject = async (req, res, next) => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId }).sort({ startDate: 1 });
    res.json(sprints);
  } catch (error) {
    next(error);
  }
};

// @desc    Get sprint details
// @route   GET /api/sprints/:id
// @access  Private
export const getSprintById = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project', 'name');

    if (!sprint) {
      res.status(404);
      throw new Error('Sprint not found');
    }

    res.json(sprint);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a sprint
// @route   POST /api/sprints
// @access  Private (Admin only)
export const createSprint = async (req, res, next) => {
  const { project, name, goal, startDate, endDate, status } = req.body;

  try {
    const sprint = await Sprint.create({
      project,
      name,
      goal,
      startDate,
      endDate,
      status: status || 'Upcoming',
    });

    await logActivity({
      project,
      sprint: sprint._id,
      user: req.user._id,
      action: 'Sprint Created',
      details: `Sprint "${name}" was created.`,
    });

    res.status(201).json(sprint);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a sprint
// @route   PUT /api/sprints/:id
// @access  Private (Admin only)
export const updateSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      res.status(404);
      throw new Error('Sprint not found');
    }

    sprint.name = req.body.name || sprint.name;
    sprint.goal = req.body.goal || sprint.goal;
    sprint.startDate = req.body.startDate || sprint.startDate;
    sprint.endDate = req.body.endDate || sprint.endDate;
    
    const prevStatus = sprint.status;
    sprint.status = req.body.status || sprint.status;

    const updatedSprint = await sprint.save();

    let logAction = 'Sprint Updated';
    let logDetails = `Sprint "${updatedSprint.name}" details were updated.`;

    if (prevStatus !== updatedSprint.status) {
      if (updatedSprint.status === 'Active') {
        logAction = 'Sprint Started';
        logDetails = `Sprint "${updatedSprint.name}" was started (Status: Active).`;
      } else if (updatedSprint.status === 'Completed') {
        logAction = 'Sprint Completed';
        logDetails = `Sprint "${updatedSprint.name}" was marked completed.`;
      }
    }

    await logActivity({
      project: sprint.project,
      sprint: sprint._id,
      user: req.user._id,
      action: logAction,
      details: logDetails,
    });

    res.json(updatedSprint);
  } catch (error) {
    next(error);
  }
};

// @desc    Get sprint analytics / completion rate
// @route   GET /api/sprints/:id/analytics
// @access  Private
export const getSprintAnalytics = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      res.status(404);
      throw new Error('Sprint not found');
    }

    const tasks = await Task.find({ sprint: sprint._id });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    
    // Status breakdowns
    const statusCounts = {
      Backlog: 0,
      Todo: 0,
      'In Progress': 0,
      Testing: 0,
      Review: 0,
      Done: 0
    };

    let estHours = 0;
    let actHours = 0;

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      estHours += task.estimatedHours || 0;
      actHours += task.actualHours || 0;
    });

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      sprintId: sprint._id,
      name: sprint.name,
      status: sprint.status,
      totalTasks,
      completedTasks,
      completionPercentage,
      statusBreakdown: statusCounts,
      hours: {
        estimated: estHours,
        actual: actHours
      }
    });
  } catch (error) {
    next(error);
  }
};
