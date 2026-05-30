import Project from '../models/Project.js';
import { logActivity } from '../utils/helpers.js';

// @desc    Get projects based on role
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res, next) => {
  try {
    let query = { archived: false };

    // Filter by role
    if (req.user.role === 'Developer') {
      query.assignedTeam = req.user._id;
    } else if (req.user.role === 'Client') {
      query.client = req.user._id;
    }
    // Admin sees all projects (query is just archived: false by default, but let's allow query params to show archived too)
    if (req.query.showArchived === 'true' && req.user.role === 'Admin') {
      delete query.archived;
    }

    const projects = await Project.find(query)
      .populate('client', 'name email')
      .populate('assignedTeam', 'name email role');
    
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get project details
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email')
      .populate('assignedTeam', 'name email role');

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Role-based auth check
    if (req.user.role === 'Developer' && !project.assignedTeam.some(dev => dev._id.toString() === req.user._id.toString())) {
      res.status(403);
      throw new Error('Access denied: You are not assigned to this project');
    }

    if (req.user.role === 'Client' && project.client._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Access denied: You are not the client for this project');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin and Client)
export const createProject = async (req, res, next) => {
  const { name, client, description, startDate, endDate, budget, priority, status, assignedTeam } = req.body;

  try {
    const isClient = req.user.role === 'Client';
    const project = await Project.create({
      name,
      client: isClient ? req.user._id : client,
      description,
      startDate,
      endDate,
      budget,
      priority: isClient ? (priority || 'Medium') : priority,
      status: isClient ? 'Planning' : (status || 'Planning'),
      assignedTeam: isClient ? [] : (assignedTeam || []),
    });

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'Project Created',
      details: `Project "${name}" was created.`,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin only)
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Update fields
    project.name = req.body.name || project.name;
    project.client = req.body.client || project.client;
    project.description = req.body.description || project.description;
    project.startDate = req.body.startDate || project.startDate;
    project.endDate = req.body.endDate || project.endDate;
    project.budget = req.body.budget !== undefined ? req.body.budget : project.budget;
    project.priority = req.body.priority || project.priority;
    project.status = req.body.status || project.status;
    project.assignedTeam = req.body.assignedTeam || project.assignedTeam;

    const updatedProject = await project.save();

    await logActivity({
      project: updatedProject._id,
      user: req.user._id,
      action: 'Project Updated',
      details: `Project "${updatedProject.name}" details were updated.`,
    });

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Archive a project
// @route   PUT /api/projects/:id/archive
// @access  Private (Admin only)
export const archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    project.archived = true;
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'Project Archived',
      details: `Project "${project.name}" was archived.`,
    });

    res.json({ message: 'Project archived successfully', project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    await Project.deleteOne({ _id: project._id });

    await logActivity({
      user: req.user._id,
      action: 'Project Deleted',
      details: `Project "${project.name}" was permanently deleted.`,
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
