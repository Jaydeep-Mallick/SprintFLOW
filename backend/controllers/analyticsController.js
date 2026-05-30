import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Timesheet from '../models/Timesheet.js';

// @desc    Get dashboard analytics depending on role
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardData = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'Admin') {
      // 1. Stat cards
      const totalProjects = await Project.countDocuments({ archived: false });
      const activeProjects = await Project.countDocuments({ status: 'Active', archived: false });
      const totalDevelopers = await User.countDocuments({ role: 'Developer' });
      const activeSprints = await Sprint.countDocuments({ status: 'Active' });
      const totalTasks = await Task.countDocuments({});
      const completedTasks = await Task.countDocuments({ status: 'Done' });
      const openTickets = await Ticket.countDocuments({ status: { $in: ['Open', 'In Progress'] } });
      const overdueTasks = await Task.countDocuments({
        status: { $ne: 'Done' },
        deadline: { $lt: new Date() },
      });

      // 2. Tasks by Status chart
      const tasks = await Task.find({});
      const statusCounts = { Backlog: 0, Todo: 0, 'In Progress': 0, Testing: 0, Review: 0, Done: 0 };
      tasks.forEach(t => {
        if (statusCounts[t.status] !== undefined) {
          statusCounts[t.status]++;
        }
      });
      const tasksByStatusChart = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
      }));

      // 3. Project Completion Rate chart (Done tasks vs total tasks per project)
      const projects = await Project.find({ archived: false });
      const projectCompletionChart = [];
      for (const proj of projects) {
        const totalProjTasks = await Task.countDocuments({ project: proj._id });
        const completedProjTasks = await Task.countDocuments({ project: proj._id, status: 'Done' });
        const rate = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
        projectCompletionChart.push({
          name: proj.name,
          rate,
        });
      }

      // 4. Developer Productivity (hours logged per dev)
      const timesheets = await Timesheet.find({}).populate('developer', 'name');
      const devHours = {};
      timesheets.forEach(ts => {
        const name = ts.developer?.name || 'Unknown';
        devHours[name] = (devHours[name] || 0) + ts.hoursWorked;
      });
      const devProductivityChart = Object.keys(devHours).map(name => ({
        name,
        hours: devHours[name],
      }));

      // 5. Sprint Progress Chart
      const sprints = await Sprint.find({ status: { $in: ['Active', 'Completed'] } }).populate('project', 'name');
      const sprintProgressChart = [];
      for (const spr of sprints) {
        const totalSprTasks = await Task.countDocuments({ sprint: spr._id });
        const completedSprTasks = await Task.countDocuments({ sprint: spr._id, status: 'Done' });
        const completionRate = totalSprTasks > 0 ? Math.round((completedSprTasks / totalSprTasks) * 100) : 0;
        sprintProgressChart.push({
          name: `${spr.project?.name || 'Proj'}: ${spr.name}`,
          rate: completionRate,
          status: spr.status,
        });
      }

      res.json({
        stats: {
          totalProjects,
          activeProjects,
          totalDevelopers,
          activeSprints,
          totalTasks,
          completedTasks,
          overdueTasks,
          openTickets,
        },
        charts: {
          tasksByStatus: tasksByStatusChart,
          projectCompletion: projectCompletionChart,
          developerProductivity: devProductivityChart,
          sprintProgress: sprintProgressChart,
        },
      });
    } 
    
    else if (role === 'Developer') {
      const devId = req.user._id;

      // 1. Stats
      const assignedTasks = await Task.countDocuments({ assignedDeveloper: devId });
      const completedTasks = await Task.countDocuments({ assignedDeveloper: devId, status: 'Done' });
      const pendingTasks = await Task.countDocuments({ assignedDeveloper: devId, status: { $ne: 'Done' } });

      // Active sprints details the dev is in
      const devProjects = await Project.find({ assignedTeam: devId, archived: false }).select('_id');
      const activeSprint = await Sprint.findOne({
        project: { $in: devProjects.map(p => p._id) },
        status: 'Active',
      }).populate('project', 'name');

      // 2. Hours logged this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const weeklySheets = await Timesheet.find({
        developer: devId,
        date: { $gte: startOfWeek },
      });
      const weeklyHours = weeklySheets.reduce((sum, sheet) => sum + sheet.hoursWorked, 0);

      // Tasks assigned to developer
      const tasksList = await Task.find({ assignedDeveloper: devId })
        .populate('project', 'name')
        .populate('sprint', 'name')
        .sort({ deadline: 1 });

      res.json({
        stats: {
          assignedTasks,
          completedTasks,
          pendingTasks,
          weeklyHours,
          activeSprint: activeSprint ? { name: activeSprint.name, goal: activeSprint.goal, project: activeSprint.project.name } : null,
        },
        tasks: tasksList,
      });
    } 
    
    else if (role === 'Client') {
      const clientId = req.user._id;

      // Projects client owns
      const clientProjects = await Project.find({ client: clientId, archived: false });
      const clientProjectIds = clientProjects.map(p => p._id);

      const totalProjects = clientProjects.length;
      const activeProjects = clientProjects.filter(p => p.status === 'Active').length;

      // Active Sprints
      const activeSprints = await Sprint.find({
        project: { $in: clientProjectIds },
        status: 'Active',
      }).populate('project', 'name');

      // Tickets raised
      const openTickets = await Ticket.countDocuments({ client: clientId, status: { $in: ['Open', 'In Progress'] } });

      // Tasks stats for their projects
      const totalTasks = await Task.countDocuments({ project: { $in: clientProjectIds } });
      const completedTasks = await Task.countDocuments({ project: { $in: clientProjectIds }, status: 'Done' });

      const projectStatusBreakdown = clientProjects.map(p => ({
        name: p.name,
        status: p.status,
      }));

      const sprintProgress = [];
      for (const spr of activeSprints) {
        const totalSprTasks = await Task.countDocuments({ sprint: spr._id });
        const completedSprTasks = await Task.countDocuments({ sprint: spr._id, status: 'Done' });
        const completionRate = totalSprTasks > 0 ? Math.round((completedSprTasks / totalSprTasks) * 100) : 0;
        sprintProgress.push({
          name: spr.name,
          project: spr.project.name,
          completion: completionRate,
        });
      }

      res.json({
        stats: {
          totalProjects,
          activeProjects,
          openTickets,
          totalTasks,
          completedTasks,
        },
        projects: clientProjects,
        projectStatus: projectStatusBreakdown,
        sprints: sprintProgress,
      });
    }
  } catch (error) {
    next(error);
  }
};
