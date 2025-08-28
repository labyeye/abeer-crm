
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const inventory = require('./routes/inventoryRoutes');
const staff = require('./routes/staffRoutes');
const branches = require('./routes/branchRoutes');
const attendance = require('./routes/attendanceRoutes');
const clients = require('./routes/clientRoutes');
const rentals = require('./routes/rentalRoutes');
const notifications = require('./routes/notificationRoutes');
const tasks = require('./routes/taskRoutes');
const quotations = require('./routes/quotationRoutes');
const production = require('./routes/productionRoutes');
const vendors = require('./routes/vendorRoutes');
const analytics = require('./routes/analyticsRoutes');
// Phase 3 - Advanced Features
const ai = require('./routes/aiRoutes');
const mobile = require('./routes/mobileRoutes');
const automation = require('./routes/automationRoutes');
const integrations = require('./routes/integrationRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/staff', staff);
app.use('/api/branches', branches);
app.use('/api/attendance', attendance);
app.use('/api/clients', clients);
app.use('/api/rentals', rentals);
app.use('/api/notifications', notifications);
app.use('/api/tasks', tasks);
app.use('/api/quotations', quotations);
app.use('/api/production', production);
app.use('/api/vendors', vendors);
app.use('/api/analytics', analytics);
// Phase 3 - Advanced Features
app.use('/api/ai', ai);
app.use('/api/mobile', mobile);
app.use('/api/automation', automation);
app.use('/api/integrations', integrations);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});