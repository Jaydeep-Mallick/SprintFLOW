import Timesheet from '../models/Timesheet.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { logActivity } from '../utils/helpers.js';

// @desc    Log work hours
// @route   POST /api/timesheets
// @access  Private (Developer only)
export const logHours = async (req, res, next) => {
  const { project, task: taskId, hoursWorked, notes, date } = req.body;

  try {
    if (req.user.role !== 'Developer') {
      res.status(403);
      throw new Error('Only developers can log work hours');
    }

    if (!project || !taskId || !hoursWorked || !notes) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const timesheet = await Timesheet.create({
      developer: req.user._id,
      project,
      task: taskId,
      date: date || Date.now(),
      hoursWorked: Number(hoursWorked),
      notes,
    });

    // Update actual hours logged on the task
    task.actualHours += Number(hoursWorked);
    await task.save();

    await logActivity({
      project,
      task: taskId,
      user: req.user._id,
      action: 'Hours Logged',
      details: `Logged ${hoursWorked} hours. Notes: "${notes}"`,
    });

    res.status(201).json(timesheet);
  } catch (error) {
    next(error);
  }
};

// @desc    Get developer's own timesheets
// @route   GET /api/timesheets/my
// @access  Private (Developer only)
export const getMyTimesheets = async (req, res, next) => {
  try {
    const timesheets = await Timesheet.find({ developer: req.user._id })
      .populate('project', 'name')
      .populate('task', 'title')
      .sort({ date: -1 });
    
    res.json(timesheets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timesheet summaries (Admin report analytics)
// @route   GET /api/timesheets/admin/summary
// @access  Private (Admin only)
export const getAdminTimesheetReports = async (req, res, next) => {
  try {
    const timesheets = await Timesheet.find({})
      .populate('developer', 'name email')
      .populate('project', 'name budget client')
      .populate('task', 'title status estimatedHours actualHours')
      .sort({ date: -1 });

    // Calculate aggregated metrics
    const devProductivity = {}; // { devName: totalHours }
    const projectHours = {}; // { projectName: totalHours }

    timesheets.forEach(sheet => {
      const devName = sheet.developer?.name || 'Unknown Developer';
      const projName = sheet.project?.name || 'Unknown Project';

      devProductivity[devName] = (devProductivity[devName] || 0) + (sheet.hoursWorked || 0);
      projectHours[projName] = (projectHours[projName] || 0) + (sheet.hoursWorked || 0);
    });

    res.json({
      timesheets,
      devProductivity,
      projectHours,
    });
  } catch (error) {
    next(error);
  }
};
