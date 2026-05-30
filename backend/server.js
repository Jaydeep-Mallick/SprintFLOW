import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import sprintRoutes from './routes/sprintRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import timesheetRoutes from './routes/timesheetRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

// Connect to Database (auto fallbacks to memory server if local URI unavailable)
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc) or from allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now (can restrict later)
    }
  },
  credentials: true,
}));
app.use(express.json());

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Backward-compatible aliases for deployments that point the frontend at the
// backend origin without the /api suffix.
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/sprints', sprintRoutes);
app.use('/tasks', taskRoutes);
app.use('/comments', commentRoutes);
app.use('/timesheets', timesheetRoutes);
app.use('/tickets', ticketRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SprintFlow API is running smoothly' });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
