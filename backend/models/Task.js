import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  assignedDeveloper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    default: null,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Backlog', 'Todo', 'In Progress', 'Testing', 'Review', 'Done'],
    default: 'Backlog',
  },
  deadline: {
    type: Date,
    required: true,
  },
  estimatedHours: {
    type: Number,
    required: true,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
  attachments: [{
    type: String, // URLs or paths to uploaded files
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
