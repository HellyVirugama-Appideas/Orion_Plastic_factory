const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup (for admin panel)
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'admin/views')
]);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/profile', profileRoutes);


app.use('/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      driver: '/api/driver',
      profile: '/api/profile',
      admin: '/api/admin'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8000

app.listen(PORT,()=>{
    console.log(`app is running on ${PORT} `);
})

module.exports = app;