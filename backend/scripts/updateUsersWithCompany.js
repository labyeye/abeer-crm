
const mongoose = require('mongoose');
const User = require('../models/User');

const DEFAULT_COMPANY_ID = 'YOUR_COMPANY_OBJECTID_HERE'; 

async function updateUsers() {
  await mongoose.connect('mongodb://localhost:27017/abeer-crm'); 
  const result = await User.updateMany(
    { company: { $exists: false } },
    { $set: { company: DEFAULT_COMPANY_ID } }
  );
  console.log('Users updated:', result.modifiedCount);
  mongoose.disconnect();
}

updateUsers();