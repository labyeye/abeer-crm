const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });
dotenv.config(); // Also try loading from .env file in root

const demoCompanies = [
  {
    name: 'PhotoPro Studios',
    email: 'contact@photopro.com',
    phone: '+1 (555) 0100',
    address: {
      street: '123 Broadway',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    website: 'https://www.photoprostudios.com',
    industry: 'Photography',
    foundedYear: 2020,
    employeeCount: 28,
    revenue: 125000,
    description: 'Premium photography studio specializing in wedding, corporate, and event photography.',
    status: 'active'
  },
  {
    name: 'Creative Vision Media',
    email: 'info@creativevision.com',
    phone: '+1 (555) 0200',
    address: {
      street: '456 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90028',
      country: 'United States'
    },
    website: 'https://www.creativevisionmedia.com',
    industry: 'Videography',
    foundedYear: 2019,
    employeeCount: 22,
    revenue: 98000,
    description: 'Full-service video production company for commercials, music videos, and corporate content.',
    status: 'active'
  },
  {
    name: 'Elite Photography Group',
    email: 'hello@elitephoto.com',
    phone: '+1 (555) 0300',
    address: {
      street: '789 Michigan Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'United States'
    },
    website: 'https://www.elitephotographygroup.com',
    industry: 'Photography',
    foundedYear: 2021,
    employeeCount: 15,
    revenue: 67000,
    description: 'Specialized in portrait, family, and maternity photography with a modern approach.',
    status: 'active'
  },
  {
    name: 'Digital Dreams Studio',
    email: 'contact@digitaldreams.com',
    phone: '+1 (555) 0400',
    address: {
      street: '321 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      country: 'United States'
    },
    website: 'https://www.digitaldreamsstudio.com',
    industry: 'Other',
    foundedYear: 2018,
    employeeCount: 8,
    revenue: 23000,
    description: 'Digital art and photo editing studio offering creative post-production services.',
    status: 'inactive'
  },
  {
    name: 'Wedding Wonders Photography',
    email: 'info@weddingwonders.com',
    phone: '+1 (555) 0500',
    address: {
      street: '654 Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'United States'
    },
    website: 'https://www.weddingwonders.com',
    industry: 'Wedding Services',
    foundedYear: 2022,
    employeeCount: 12,
    revenue: 89000,
    description: 'Dedicated wedding photography and videography services with a focus on capturing magical moments.',
    status: 'active'
  }
];

const createDemoCompanies = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB...');

    // Find a chairman user to assign as creator
    const chairman = await User.findOne({ role: 'chairman' });
    if (!chairman) {
      console.error('❌ No chairman user found. Please create a chairman user first.');
      return;
    }

    // Clear existing demo companies
    await Company.deleteMany({
      email: { $in: demoCompanies.map(company => company.email) }
    });
    console.log('Cleared existing demo companies...');

    // Add createdBy field to all companies
    const companiesWithCreator = demoCompanies.map(company => ({
      ...company,
      createdBy: chairman._id
    }));

    // Create new demo companies
    const createdCompanies = await Company.create(companiesWithCreator);
    
    console.log('✅ Demo companies created successfully!');
    console.log('\n📋 Created Companies:');
    createdCompanies.forEach(company => {
      console.log(`   🏢 ${company.name}`);
      console.log(`      📧 ${company.email}`);
      console.log(`      🏭 ${company.industry}`);
      console.log(`      💰 Revenue: $${company.revenue?.toLocaleString() || 'N/A'}`);
      console.log(`      👥 Employees: ${company.employeeCount || 'N/A'}`);
      console.log(`      📍 ${company.address.city}, ${company.address.state}`);
      console.log('');
    });

    console.log('🎉 You can now test the company management system!');
    
  } catch (error) {
    console.error('❌ Error creating demo companies:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoCompanies(); 