const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });
dotenv.config(); // Also try loading from .env file in root

const createBranchUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // First, let's find an existing branch to assign the user to
    const branch = await Branch.findOne();
    if (!branch) {
      console.log('No branch found. Please create a branch first using createDemoCompanies.js');
      return;
    }

    console.log('Found branch:', branch.companyName);

    // Create a branch manager user
    const branchUser = {
      name: 'Branch Manager',
      email: 'branch@photoerp.com',
      password: 'branch123',
      phone: '+1234567895',
      role: 'manager', // This will be mapped to 'branch_head' in frontend
      branch: branch._id
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: branchUser.email });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Create the user
    const user = await User.create(branchUser);
    console.log('Branch user created successfully!');
    console.log('User Details:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Password: branch123');
    console.log('- Role:', user.role);
    console.log('- Branch:', branch.companyName);

    console.log('\nYou can now login with:');
    console.log('Email: branch@photoerp.com');
    console.log('Password: branch123');

  } catch (error) {
    console.error('Error creating branch user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createBranchUser();
