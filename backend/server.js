
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
const companies = require('./routes/companyRoutes');
const inventory = require('./routes/inventoryRoutes');
const staff = require('./routes/staffRoutes');
const attendance = require('./routes/attendanceRoutes');
const clients = require('./routes/clientRoutes');
const rentals = require('./routes/rentalRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', auth);
app.use('/api/companies', companies);
app.use('/api/inventory', inventory);
app.use('/api/staff', staff);
app.use('/api/attendance', attendance);
app.use('/api/clients', clients);
app.use('/api/rentals', rentals);

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