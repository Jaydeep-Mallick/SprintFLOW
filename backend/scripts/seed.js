import mongoose from 'mongoose';
import dotenv from 'dotenv';
import firebaseAdmin from '../config/firebaseAdmin.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import Timesheet from '../models/Timesheet.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

export const seedData = async (shouldDisconnect = false) => {
  try {
    // Clear existing data
    console.log('🌱 Seeding database with fresh sample datasets...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Sprint.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Timesheet.deleteMany({});
    await Ticket.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});

    // Helper to sync seed user creation with Firebase Auth
    const createSeedUser = async (name, email, password, role) => {
      // 1. Create in MongoDB
      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      // 2. Clean up and create in Firebase Auth (gracefully catch errors if offline/emulator not running)
      try {
        try {
          const existingUser = await firebaseAdmin.auth().getUserByEmail(email);
          await firebaseAdmin.auth().deleteUser(existingUser.uid);
        } catch (err) {
          // User not found in Firebase, ignore
        }

        try {
          await firebaseAdmin.auth().deleteUser(user._id.toString());
        } catch (err) {
          // User not found in Firebase, ignore
        }

        // 3. Create in Firebase Auth using the exact MongoDB _id as the Firebase uid
        await firebaseAdmin.auth().createUser({
          uid: user._id.toString(),
          email,
          password,
          displayName: name,
        });
      } catch (fbError) {
        console.warn(`⚠️ Firebase Auth Sync Warning: Could not provision "${name}" in Firebase Auth:`, fbError.message);
      }

      return user;
    };

    // 1. Create Users
    const admin = await createSeedUser('Sarah Jenkins', 'admin@sprintflow.com', 'admin123', 'Admin');
    const dev1 = await createSeedUser('Alice Vance', 'alice@sprintflow.com', 'dev123', 'Developer');
    const dev2 = await createSeedUser('Robert Chen', 'bob@sprintflow.com', 'dev123', 'Developer');
    const dev3 = await createSeedUser('Charles Patel', 'charlie@sprintflow.com', 'dev123', 'Developer');
    const dev4 = await createSeedUser('David Miller', 'david@sprintflow.com', 'dev123', 'Developer');
    const dev5 = await createSeedUser('Eva Lin', 'eva@sprintflow.com', 'dev123', 'Developer');
    const client1 = await createSeedUser('Jonathan Sterling (Acme Corp)', 'acme@client.com', 'client123', 'Client');
    const client2 = await createSeedUser('Anthony Reynolds (Stark Industries)', 'stark@client.com', 'client123', 'Client');

    // 2. Create Projects
    const project1 = await Project.create({
      name: 'Apollo Web Application',
      client: client1._id,
      description: 'Rebuilding Acme Corp\'s legacy retail dashboard with React, Node, and Tailwind. High performance, security, and responsive layouts are critical criteria.',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      budget: 50000,
      priority: 'High',
      status: 'Active',
      assignedTeam: [dev1._id, dev2._id, dev3._id, dev4._id],
    });

    const project2 = await Project.create({
      name: 'Hulk Mobile Portal',
      client: client2._id,
      description: 'Developing a secure mobile app dashboard for Stark Industries employees to report device logistics and resource telemetry tracking.',
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      budget: 75000,
      priority: 'Critical',
      status: 'Planning',
      assignedTeam: [dev2._id, dev3._id, dev5._id],
    });

    const project3 = await Project.create({
      name: 'Falcon Cloud Migration',
      client: client1._id,
      description: 'Migrating self-hosted server deployments to managed GCP/AWS container clusters with CI/CD optimizations.',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      budget: 35000,
      priority: 'Medium',
      status: 'On Hold',
      assignedTeam: [dev1._id, dev4._id, dev5._id],
    });

    // 3. Create Sprints
    const sprint1_p1 = await Sprint.create({
      project: project1._id,
      name: 'Sprint 1: Base Boilerplate',
      goal: 'Establish MongoDB database connections, setup authentication routing, build sidebar routing and page wireframes on frontend.',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      status: 'Completed',
    });

    const sprint2_p1 = await Sprint.create({
      project: project1._id,
      name: 'Sprint 2: Core Dashboard & Kanban',
      goal: 'Implement task dragging Kanban boards, log and display timesheets, build charts on the analytics dashboards, and enable client support ticket tracking.',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    const sprint3_p1 = await Sprint.create({
      project: project1._id,
      name: 'Sprint 3: Reports & PDF Export',
      goal: 'Finalize reporting spreadsheets, add print exports, refine UI notification badges, and conduct user acceptance testing.',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      status: 'Upcoming',
    });

    const sprint1_p2 = await Sprint.create({
      project: project2._id,
      name: 'Sprint 1: Setup & Wireframing',
      goal: 'Design Figma layout, build initial schema, configure mobile build configurations.',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000),
      status: 'Upcoming',
    });

    // 4. Create Tasks
    const t1 = await Task.create({
      title: 'Design Database Schemas',
      description: 'Detail user schema with role permissions, task details, and support ticket schemas. Document mappings.',
      assignedDeveloper: dev1._id,
      project: project1._id,
      sprint: sprint1_p1._id,
      priority: 'High',
      status: 'Done',
      deadline: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      actualHours: 10,
    });

    const t2 = await Task.create({
      title: 'Setup Express API Boilerplate',
      description: 'Install express, cors, dotenv, configure basic error handling, routes, and start test runs.',
      assignedDeveloper: dev2._id,
      project: project1._id,
      sprint: sprint1_p1._id,
      priority: 'Medium',
      status: 'Done',
      deadline: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      estimatedHours: 6,
      actualHours: 6,
    });

    const t3 = await Task.create({
      title: 'Implement JWT Auth & Role Access',
      description: 'Integrate bcrypt hashing, JWT token issues on login, and write route middleware to restrict developer/client panels.',
      assignedDeveloper: dev1._id,
      project: project1._id,
      sprint: sprint2_p1._id,
      priority: 'Critical',
      status: 'In Progress',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedHours: 12,
      actualHours: 4,
    });

    const t4 = await Task.create({
      title: 'Create Kanban UI Board Component',
      description: 'Build a drag and drop container displaying Backlog, Todo, In Progress, Testing, Review, Done cards.',
      assignedDeveloper: dev2._id,
      project: project1._id,
      sprint: sprint2_p1._id,
      priority: 'High',
      status: 'Todo',
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      estimatedHours: 16,
      actualHours: 0,
    });

    const t5 = await Task.create({
      title: 'Develop support ticketing module API',
      description: 'Write backend routes for Clients to create tickets and post comments, and Admins to handle assignments.',
      assignedDeveloper: dev3._id,
      project: project1._id,
      sprint: sprint2_p1._id,
      priority: 'High',
      status: 'Review',
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      estimatedHours: 10,
      actualHours: 12,
    });

    const t6 = await Task.create({
      title: 'Add stats charts on Dashboard',
      description: 'Integrate Recharts to draw tasks status pie charts, developer productivity lines, and project metrics on the Admin Dashboard.',
      assignedDeveloper: dev4._id,
      project: project1._id,
      sprint: sprint2_p1._id,
      priority: 'Medium',
      status: 'In Progress',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
      actualHours: 2,
    });

    const t7 = await Task.create({
      title: 'Resolve layout alignment bugs',
      description: 'Fix double scrollbars on the Kanban board viewports when running on small tablet screens.',
      assignedDeveloper: dev2._id,
      project: project1._id,
      sprint: sprint2_p1._id,
      priority: 'Low',
      status: 'Done',
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 4,
      actualHours: 5,
    });

    const t8 = await Task.create({
      title: 'Setup automated Slack alerts',
      description: 'Hook webhook notifications to notify channels when a task is completed or support ticket is created.',
      assignedDeveloper: null,
      project: project1._id,
      sprint: null,
      priority: 'Low',
      status: 'Backlog',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estimatedHours: 6,
      actualHours: 0,
    });

    const t9 = await Task.create({
      title: 'Telemetry Payload definition',
      description: 'Define and validate the JSON schema representing the device sensor telemetry inputs from workers.',
      assignedDeveloper: dev5._id,
      project: project2._id,
      sprint: null,
      priority: 'High',
      status: 'Backlog',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      estimatedHours: 8,
    });

    // 5. Comments
    await Comment.create({
      task: t5._id,
      author: dev3._id,
      content: 'I have finished writing the endpoints. Added validation to make sure Clients can only post tickets under categories like Bug or Change Request.',
      replies: [
        {
          author: admin._id,
          content: 'Excellent Charles. I am reviewing the code now. Looks clean, just ensure we populate client details on comments return.',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        }
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    // 6. Timesheets
    await Timesheet.create({
      developer: dev1._id,
      project: project1._id,
      task: t1._id,
      date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      hoursWorked: 6,
      notes: 'Initial work mapping schemas for users and tasks.',
    });
    await Timesheet.create({
      developer: dev1._id,
      project: project1._id,
      task: t1._id,
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      hoursWorked: 4,
      notes: 'Finalized ticket schema and double-checked relations with mongoose populate.',
    });
    await Timesheet.create({
      developer: dev2._id,
      project: project1._id,
      task: t2._id,
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      hoursWorked: 6,
      notes: 'Setup server configurations and database connection.',
    });
    await Timesheet.create({
      developer: dev1._id,
      project: project1._id,
      task: t3._id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      hoursWorked: 4,
      notes: 'Began writing auth protect middleware and bcrypt password hashes.',
    });
    await Timesheet.create({
      developer: dev3._id,
      project: project1._id,
      task: t5._id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      hoursWorked: 8,
      notes: 'Drafted support ticket controllers and CRUD endpoints.',
    });
    await Timesheet.create({
      developer: dev3._id,
      project: project1._id,
      task: t5._id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      hoursWorked: 4,
      notes: 'Finished reviews feedback, added client details populates.',
    });

    // 7. Support Tickets
    await Ticket.create({
      client: client1._id,
      title: 'Production Billing Dashboard Crash',
      description: 'When loading the billing report page, the client dashboard throws a 500 error after selecting date range. Urgent assistance needed.',
      category: 'Bug',
      priority: 'Critical',
      status: 'Open',
      assignedAdmin: null,
    });
    await Ticket.create({
      client: client2._id,
      title: 'Change Request: Custom logo on dashboards',
      description: 'Stark Industries requests ability to upload branding assets. This is to replace the generic navbar logo.',
      category: 'Change Request',
      priority: 'Medium',
      status: 'In Progress',
      assignedAdmin: admin._id,
      comments: [
        {
          author: admin._id,
          content: 'Hi Anthony, I have assigned this ticket to myself. We will schedule it for our next sprint layout updates.',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        }
      ],
    });

    // 8. Notifications
    await Notification.create({
      user: dev1._id,
      title: 'New Task Assigned',
      message: 'You have been assigned: "Implement JWT Auth & Role Access".',
      type: 'TaskAssigned',
      read: false,
    });
    await Notification.create({
      user: dev2._id,
      title: 'New Task Assigned',
      message: 'You have been assigned: "Create Kanban UI Board Component".',
      type: 'TaskAssigned',
      read: true,
    });
    await Notification.create({
      user: admin._id,
      title: 'New Support Ticket Created',
      message: 'Acme Corp has raised ticket: "Production Billing Dashboard Crash".',
      type: 'TicketCreated',
      read: false,
    });

    // 9. Activity Logs
    await ActivityLog.create({
      project: project1._id,
      user: admin._id,
      action: 'Project Created',
      details: 'SARAH JENKINS created project "Apollo Web Application".',
    });
    await ActivityLog.create({
      project: project1._id,
      sprint: sprint1_p1._id,
      user: admin._id,
      action: 'Sprint Created',
      details: 'SARAH JENKINS created Sprint "Sprint 1: Base Boilerplate".',
    });
    await ActivityLog.create({
      project: project1._id,
      sprint: sprint1_p1._id,
      task: t1._id,
      user: dev1._id,
      action: 'Status Changed',
      details: 'Alice Vance marked "Design Database Schemas" as Done.',
    });
    await ActivityLog.create({
      project: project1._id,
      sprint: sprint2_p1._id,
      task: t5._id,
      user: dev3._id,
      action: 'Comment Added',
      details: 'Charles Patel commented on ticket: "I have finished writing the endpoints..."',
    });

    console.log('✅ Database seeded successfully with sample data!');

    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('Disconnected from database after seed.');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (shouldDisconnect) {
      process.exit(1);
    }
  }
};

// Check if run directly
const isRunDirectly = import.meta.url.endsWith(process.argv[1]);
if (isRunDirectly) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sprintflow';
  console.log('Running seeding script directly. Connecting to:', mongoUri);
  mongoose.connect(mongoUri)
    .then(() => seedData(true))
    .catch((err) => {
      console.error('Connection failed:', err.message);
      process.exit(1);
    });
}
