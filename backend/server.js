const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');


dotenv.config();


connectDB();


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
const dailyExpenses = require('./routes/dailyExpensesRoutes');
const vendors = require('./routes/vendorRoutes');
const analytics = require('./routes/analyticsRoutes');
const expenses = require('./routes/expenseRoutes');

const ai = require('./routes/aiRoutes');
const mobile = require('./routes/mobileRoutes');
const automation = require('./routes/automationRoutes');
const integrations = require('./routes/integrationRoutes');

const app = express();


app.use(express.json());


const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://abeer-crm.vercel.app', 
    'http://localhost:2500' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization','Access-Control-Allow-Origin']
};

app.use(cors(corsOptions));


app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/staff', staff);
app.use('/api/branches', branches);
app.use('/api/attendance', attendance);
const bookings = require('./routes/bookingRoutes');
app.use('/api/bookings', bookings);
app.use('/api/clients', clients);
app.use('/api/rentals', rentals);
app.use('/api/notifications', notifications);
app.use('/api/tasks', tasks);
app.use('/api/quotations', quotations);
app.use('/api/production', production);
app.use('/api/daily-expenses', dailyExpenses);
app.use('/api/vendors', vendors);
app.use('/api/analytics', analytics);
app.use('/api/expenses', expenses);

app.use('/api/ai', ai);
app.use('/api/mobile', mobile);
app.use('/api/automation', automation);
app.use('/api/integrations', integrations);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold
  )
);


process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  
  server.close(() => process.exit(1));
});