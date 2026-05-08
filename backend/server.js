require('dotenv').config({ override: true });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const roleRoutes = require('./routes/role.routes');
const analysisRoutes = require('./routes/analysis.routes');
const aiRoutes = require('./routes/ai.routes');
const notificationRoutes = require('./routes/notification.routes');
const progressRoutes = require('./routes/progress.routes');
const searchRoutes = require('./routes/search.routes');
const exportRoutes = require('./routes/export.routes');
const adminRoutes = require('./routes/admin.routes');
const managerRoutes = require('./routes/manager.routes');
const achievementRoutes = require('./routes/achievement.routes');
const skillRoutes = require('./routes/skill.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to controllers via req.app.get('io')
app.set('io', io);

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a named room (supports both string rooms and object-param rooms)
  socket.on('join_room', (payload) => {
    if (typeof payload === 'string') {
      socket.join(payload);
      console.log(`Socket ${socket.id} joined room: ${payload}`);
    } else if (payload?.employeeId) {
      socket.join(`employee_${payload.employeeId}`);
      console.log(`Socket ${socket.id} joined room: employee_${payload.employeeId}`);
    } else if (payload?.room) {
      socket.join(payload.room);
      console.log(`Socket ${socket.id} joined room: ${payload.room}`);
    }
  });

  // Join user-specific room for notifications
  socket.on('join_user', ({ userId }) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room: user_${userId}`);
    }
  });

  // Manager joins room and department room
  socket.on('join_manager_room', ({ managerId, department }) => {
    if (managerId) {
      socket.join(`manager_${managerId}`);
      console.log(`Socket ${socket.id} joined manager room: manager_${managerId}`);
    }
    if (department) {
      socket.join(`dept_${department}`);
      console.log(`Socket ${socket.id} joined room: dept_${department}`);
    }
  });
  
  // Manager leaves manager and department rooms
  socket.on('leave_manager_room', () => {
    // Socket.io automatically handles cleanup on disconnect, but we can allow explicit leave
    // We would need to store the user's rooms on the socket instance if we want to leave precisely,
    // or the client can disconnect the socket completely when unmounting.
    console.log(`Socket ${socket.id} requested to leave manager rooms.`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
connectDB();

// CORS — allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/skills', skillRoutes);

// ── PUBLIC stats endpoint for landing page (no auth required) ──────────────
app.get('/api/stats', async (req, res) => {
  try {
    const Employee = require('./models/Employee');
    const LearningProgress = require('./models/LearningProgress');

    const [employees, learningRecords] = await Promise.all([
      Employee.find().lean(),
      LearningProgress.find().lean(),
    ]);

    const totalEmployees = employees.length;
    const withLearningPath = employees.filter(e => e.aiLearningPath && e.aiLearningPath.length > 0).length;

    let totalCoursesCompleted = 0;
    let totalHours = 0;
    learningRecords.forEach(r => {
      totalCoursesCompleted += (r.completedCourses || []).length;
      totalHours += r.totalHoursSpent || 0;
    });

    const avgReadiness = totalEmployees
      ? Math.round(employees.reduce((s, e) => s + (e.gapScore || 0), 0) / totalEmployees)
      : 0;

    return res.json({
      totalEmployees,
      withLearningPath,
      totalCoursesCompleted,
      totalHours: Math.round(totalHours),
      avgReadiness,
    });
  } catch (err) {
    console.error('Public stats error:', err);
    return res.status(500).json({ message: 'Stats unavailable' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
