const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });
dotenv.config(); // Also try loading from .env file in root

const demoUsers = [
  {
    name: 'John Chairman',
    email: 'chairman@photoerp.com',
    password: 'demo123',
    phone: '+1234567890',
    role: 'chairman'
  },
  {
    name: 'Sarah Admin',
    email: 'admin@photoerp.com',
    password: 'demo321',
    phone: '+1234567891',
    role: 'admin'
  },
  {
    name: 'Mike Manager',
    email: 'manager@photoerp.com',
    password: 'demo4567',
    phone: '+1234567892',
    role: 'manager'
  },
  {
    name: 'Lisa Staff',
    email: 'staff@photoerp.com',
    password: 'demo19087',
    phone: '+1234567893',
    role: 'staff'
  },
  {
    name: 'David Client',
    email: 'client@photoerp.com',
    password: 'demo123',
    phone: '+1234567894',
    role: 'client'
  }
];

const createDemoUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB...');

    // Clear existing demo users
    await User.deleteMany({
      email: { $in: demoUsers.map(user => user.email) }
    });
    console.log('Cleared existing demo users...');

    // Create new demo users
    const createdUsers = await User.create(demoUsers);
    
    console.log('✅ Demo users created successfully!');
    console.log('\n📋 Created Users:');
    createdUsers.forEach(user => {
      console.log(`   👤 ${user.name} (${user.role})`);
      console.log(`      📧 ${user.email}`);
      console.log(`      🔑 Password: demo123`);
      console.log('');
    });

    console.log('🎉 You can now login with any of these accounts!');
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoUsers(); 