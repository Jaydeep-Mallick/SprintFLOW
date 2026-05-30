import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ project, task, sprint, user, action, details }) => {
  try {
    await ActivityLog.create({
      project: project || null,
      task: task || null,
      sprint: sprint || null,
      user,
      action,
      details,
    });
  } catch (error) {
    console.error('Error creating activity log:', error.message);
  }
};

export const createNotification = async ({ user, title, message, type }) => {
  try {
    await Notification.create({
      user,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};
