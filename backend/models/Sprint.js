import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  goal: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Active', 'Completed'],
    default: 'Upcoming',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Sprint = mongoose.model('Sprint', sprintSchema);
export default Sprint;
