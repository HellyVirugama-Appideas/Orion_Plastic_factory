// const express = require('express');
// require('dotenv').config();
// const cors = require('cors');
// const path = require('path');
// const morgan = require('morgan');
// const socketIO = require("socket.io")
// const http = require("http")
// const cookieParser = require("cookie-parser")

// // Import configurations
// const connectDB = require('./config/db');

// // Import routes
// const authRoutes = require('./routes/authRoutes');
// const driverRoutes = require('./routes/driverRoutes');
// const profileRoutes = require('./routes/profileRoutes');
// const adminRoutes = require('./routes/admin/adminRoutes');
// const deliveryRoutes = require("./routes/deliveryRoutes")
// const trackingRoutes = require("./routes/trackingRoutes")
// const journeyRoutes = require("./routes/journeyRoutes")
// const routeRoutes = require("./routes/routeRoutes")
// const feedbackRoutes = require("./routes/feedbackRoutes")
// const orderRoutes = require("./routes/admin/orderRoutes")
// const vehicleRoutes = require("./routes/admin/vehicleRoutes")
// const regionRoutes = require("./routes/admin/regionRoutes")
// const driverManagementRoutes = require("./routes/admin/driverManagementRoutes")
// const customerRoutes = require("./routes/admin/customerRoutes")
// const remarkAdminRoutes = require("./routes/admin/remarkAdminRoutes")
// const remarkRoutes = require("./routes/remarkRoutes")
// const maintenanceRoutes = require("./routes/maintenanceRoutes")
// const maintenanceAdminRoutes = require("./routes/admin/maintenanceAdminRoutes")
// const expenseAdminRoutes = require("./routes/admin/expenseAdminRoutes")
// const expenseRoutes = require("./routes/expenseRoutes")
// const deliveryAdminRoutes = require("./routes/admin/deliveryAdminRoutes.")
// const AdminTrackingRoutes = require("./routes/admin/AdminTrackingRoutes")

// // Import middleware
// const errorHandler = require('./middleware/errorHandler');

// // Initialize express app 
// const app = express();
// const server = http.createServer(app)

// const io = socketIO(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// })

// // Make io accessible globally
// global.io = io;

// // Connect to database
// connectDB();

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// app.use(express.json());
// app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan('dev')); 

// // Static files
// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// app.use(express.static(path.join(__dirname, 'public')));

// // View engine setup (for admin panel)
// app.set('view engine', 'ejs');
// app.set('views', [
//   path.join(__dirname, 'views'),
//   path.join(__dirname, 'admin/views')
// ]);

// io.on("connection", (socket) => {
//   console.log("new driver connected", socket.id)

//   socket.on("join-delivery", (deliveryId) => {
//     socket.join(`delivery-${deliveryId}`);
//     console.log(`Client ${socket.id} joined delivery room: ${deliveryId}`);
//   })

//   socket.on("leave-delivery", (deliveryId) => {
//     socket.leave(`delivery-${deliveryId}`);
//     console.log(`Client ${socket.id} left delivery room: ${deliveryId}`);
//   })

//   socket.on("driver-location-update", async (data) => {
//     try {
//       const { deliveryId, latitude, longitude, speed, heading } = data

//       // Broadcast to all clients tracking this delivery
//       io.to(`delivery-${deliveryId}`).emit('location-update', {
//         deliveryId,
//         location: { latitude, longitude },
//         speed,
//         heading,
//         timestamp: new Date()
//       });
//     } catch (error) {
//       console.error('Socket location update error:', error);
//     }
//   })

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// })


// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/driver', driverRoutes);
// app.use('/api/profile', profileRoutes);

// app.use("/api/deliveries", deliveryRoutes)
// app.use("/api/tracking", trackingRoutes)

// app.use("/api/feedback", feedbackRoutes)

// app.use("/api/journey", journeyRoutes)
// app.use("/api/routes", routeRoutes)

// app.use("/api/remark",remarkRoutes)

// app.use("/api/maintenance",maintenanceRoutes)
// app.use("/api/expenses",expenseRoutes)

// /////admin

// app.use('/admin', adminRoutes);
// app.use("/admin/order", orderRoutes)

// app.use("/admin/vehicles",vehicleRoutes)
// app.use("/admin/regions",regionRoutes)
// app.use("/admin/driver",driverManagementRoutes)
// app.use("/admin/customers",customerRoutes)
// app.use("/admin/deliveries",deliveryAdminRoutes)
// app.use("/admin/remarks",remarkAdminRoutes)
// app.use("/admin/maintenance",maintenanceAdminRoutes)
// app.use("/admin/expenses",expenseAdminRoutes)
// app.use("/admin/tracking",AdminTrackingRoutes)


// // Root route
// app.get('/', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Welcome to the API',
//     version: '1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       driver: '/api/driver',
//       profile: '/api/profile',
//       admin: '/api/admin'
//     }
//   });
// });

// // Health check route
// app.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Server is healthy',
//     timestamp: new Date().toISOString()
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // Global error handler (must be last)
// app.use(errorHandler);

// const PORT = process.env.PORT || 8000

// app.listen(PORT, () => {
//   console.log(`app is running on ${PORT} `);
//   console.log(`📡 Socket.IO enabled for real-time tracking`);
// })

// module.exports = app;

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const socketIO = require("socket.io");
const http = require("http");
const cookieParser = require("cookie-parser");

// Import configurations
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const deliveryRoutes = require("./routes/deliveryRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const journeyRoutes = require("./routes/journeyRoutes");
const routeRoutes = require("./routes/routeRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const orderRoutes = require("./routes/admin/orderRoutes");
const vehicleRoutes = require("./routes/admin/vehicleRoutes");
const regionRoutes = require("./routes/admin/regionRoutes");
const driverManagementRoutes = require("./routes/admin/driverManagementRoutes");
const customerRoutes = require("./routes/admin/customerRoutes");
const remarkAdminRoutes = require("./routes/admin/remarkAdminRoutes");
const remarkRoutes = require("./routes/remarkRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const maintenanceAdminRoutes = require("./routes/admin/maintenanceAdminRoutes");
const expenseAdminRoutes = require("./routes/admin/expenseAdminRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const deliveryAdminRoutes = require("./routes/admin/deliveryAdminRoutes.");
const AdminTrackingRoutes = require("./routes/admin/AdminTrackingRoutes");

// Import Models (for notification)
const MaintenanceSchedule = require('./models/MaintenanceSchedule');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app & server
const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io globally accessible
global.io = io;

// Connect DB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'admin/views')]);

// SOCKET.IO LOGIC — SAB KUCH YAHAN HI (app.js mein)

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Admin join karega admin-room
  socket.on("join-admin-room", () => {
    socket.join("admin-room");
    console.log("Admin joined admin-room:", socket.id);
  });

  // Driver delivery tracking (existing)
  socket.on("join-delivery", (deliveryId) => {
    socket.join(`delivery-${deliveryId}`);
  });

  socket.on("leave-delivery", (deliveryId) => {
    socket.leave(`delivery-${deliveryId}`);
  });

  socket.on("driver-location-update", async (data) => {
    const { deliveryId, latitude, longitude, speed, heading } = data;
    io.to(`delivery-${deliveryId}`).emit('location-update', {
      deliveryId,
      location: { latitude, longitude },
      speed,
      heading,
      timestamp: new Date()
    });
  });

  // NAYA: Driver ne service complete mark kiya → Admin ko batao!
  socket.on("driver-completed-service", async ({ scheduleId, driverName, vehicleNumber }) => {
    try {
      const maintenance = await MaintenanceSchedule.findById(scheduleId)
        .populate('vehicle');

      if (maintenance) {
        io.to("admin-room").emit('new-service-request', {
          type: 'service_completion_request',
          message: `${vehicleNumber || 'Vehicle'} - Driver "${driverName}" ne service complete mark kiya!`,
          scheduleId,
          vehicleNumber: vehicleNumber || maintenance.vehicle?.vehicleNumber,
          driverName,
          requestedAt: new Date(),
          status: maintenance.status
        });
        console.log("Notification sent to admin:", vehicleNumber);
      }
    } catch (err) {
      console.error("Socket notification error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API ROUTES

app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/profile', profileRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/remark", remarkRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/expenses", expenseRoutes);

// Admin Routes
app.use('/admin', adminRoutes);
app.use("/admin/order", orderRoutes);
app.use("/admin/vehicles", vehicleRoutes);
app.use("/admin/regions", regionRoutes);
app.use("/admin/driver", driverManagementRoutes);
app.use("/admin/customers", customerRoutes);
app.use("/admin/deliveries", deliveryAdminRoutes);
app.use("/admin/remarks", remarkAdminRoutes);
app.use("/admin/maintenance", maintenanceAdminRoutes);
app.use("/admin/expenses", expenseAdminRoutes);
app.use("/admin/tracking", AdminTrackingRoutes);

// Root & Health
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is LIVE!', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server Healthy', time: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  console.log(`Real-time Socket.IO Active`);
  console.log(`Admin Room: admin-room`);
  console.log(`Driver Service Notification Active`);
});

module.exports = app;