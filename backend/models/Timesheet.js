import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  hoursWorked: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Timesheet = mongoose.model('Timesheet', timesheetSchema);
export default Timesheet;
