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
const payments = require('./routes/paymentRoutes');
const analytics = require('./routes/analyticsRoutes');
const expenses = require('./routes/expenseRoutes');
const serviceCategories = require('./routes/serviceCategoryRoutes');

const ai = require('./routes/aiRoutes');
const mobile = require('./routes/mobileRoutes');
const automation = require('./routes/automationRoutes');
const integrations = require('./routes/integrationRoutes');
const bookings = require('./routes/bookingRoutes');

const cookieParser = require('cookie-parser');
const app = express();


// Increase JSON/body parser size to allow base64 image payloads from the frontend
app.use(express.json({ limit: '10mb' }));
// Support URL-encoded bodies with the same size limit (forms, fallback)
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// lightweight debug logger for staff creation requests to aid in diagnosing auth issues
app.post('/api/staff', (req, res, next) => {
  try {
    console.log('DEBUG /api/staff request headers:', Object.keys(req.headers).reduce((acc, k) => { acc[k]=req.headers[k]; return acc; }, {}));
    console.log('DEBUG /api/staff cookies:', req.cookies);
    console.log('DEBUG /api/staff query token:', req.query && req.query.token);
  } catch (e) {
    console.warn('DEBUG logger for /api/staff failed', e && e.message ? e.message : e);
  }
  next();
});


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

// Ensure preflight (OPTIONS) requests are handled early and won't be redirected.
// Some hosting platforms or proxies may issue redirects for unknown paths —
// responding to OPTIONS here prevents the browser CORS preflight from failing.
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // short-circuit OPTIONS requests with 200 OK
    return res.sendStatus(200);
  }
  next();
});


app.use('/api/auth', auth);
app.use('/api/inventory', inventory);
app.use('/api/staff', staff);
app.use('/api/branches', branches);
app.use('/api/attendance', attendance);
app.use('/api/bookings', bookings);
app.use('/api/clients', clients);
app.use('/api/rentals', rentals);
app.use('/api/notifications', notifications);
app.use('/api/tasks', tasks);
app.use('/api/quotations', quotations);
app.use('/api/production', production);
app.use('/api/daily-expenses', dailyExpenses);
app.use('/api/vendors', vendors);
app.use('/api/payments', payments);
app.use('/api/analytics', analytics);
app.use('/api/expenses', expenses);
app.use('/api/service-categories', serviceCategories);

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