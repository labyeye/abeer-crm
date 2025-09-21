const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Inventory = require('../models/Inventory');
const Attendance = require('../models/Attendance');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createDemoData = async () => {
  try {
    console.log('Creating demo data...');

    // Create demo companies
    const company1 = await Company.create({
      name: 'Abeer Photography Studio',
      email: 'info@abeerphoto.com',
      phone: '+91 9876543210',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      gstNumber: '27ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      status: 'active'
    });

    const company2 = await Company.create({
      name: 'Abeer Events & Photography',
      email: 'contact@abeerevents.com',
      phone: '+91 9876543211',
      address: {
        street: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      gstNumber: '07ABCDE1234F1Z6',
      panNumber: 'ABCDE1234G',
      status: 'active'
    });

    // Create demo branches
    const branch1 = await Branch.create({
      company: company1._id,
      name: 'Mumbai Central',
      code: 'MC001',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      contactInfo: {
        phone: '+91 9876543210',
        email: 'mumbai@abeerphoto.com'
      },
      gstNumber: '27ABCDE1234F1Z5',
      status: 'active'
    });

    const branch2 = await Branch.create({
      company: company1._id,
      name: 'Andheri West',
      code: 'AW001',
      address: {
        street: '789 Link Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058'
      },
      contactInfo: {
        phone: '+91 9876543212',
        email: 'andheri@abeerphoto.com'
      },
      gstNumber: '27ABCDE1234F1Z5',
      status: 'active'
    });

    const branch3 = await Branch.create({
      company: company2._id,
      name: 'Delhi Central',
      code: 'DC001',
      address: {
        street: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      contactInfo: {
        phone: '+91 9876543211',
        email: 'delhi@abeerevents.com'
      },
      gstNumber: '07ABCDE1234F1Z6',
      status: 'active'
    });

    // Create demo users
    const user1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@abeerphoto.com',
      password: 'password123',
      phone: '+91 9876543210',
      role: 'company_admin',
      companyId: company1._id,
      branchId: branch1._id
    });

    const user2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@abeerphoto.com',
      password: 'password123',
      phone: '+91 9876543211',
      role: 'branch_admin',
      companyId: company1._id,
      branchId: branch2._id
    });

    const user3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit@abeerphoto.com',
      password: 'password123',
      phone: '+91 9876543212',
      role: 'staff',
      companyId: company1._id,
      branchId: branch1._id
    });

    const user4 = await User.create({
      name: 'Neha Singh',
      email: 'neha@abeerphoto.com',
      password: 'password123',
      phone: '+91 9876543213',
      role: 'staff',
      companyId: company1._id,
      branchId: branch1._id
    });

    const user5 = await User.create({
      name: 'Vikram Mehta',
      email: 'vikram@abeerevents.com',
      password: 'password123',
      phone: '+91 9876543214',
      role: 'company_admin',
      companyId: company2._id,
      branchId: branch3._id
    });

    // Create demo staff
    const staff1 = await Staff.create({
      user: user3._id,
      company: company1._id,
      branch: branch1._id,
      employeeId: 'EMP001',
      staffType: 'monthly',
      designation: 'Senior Photographer',
      department: 'Photography',
      joiningDate: new Date('2023-01-15'),
      salary: {
        basic: 45000,
        allowances: 5000,
        total: 50000
      },
      performance: {
        score: 95,
        totalTasks: 150,
        completedTasks: 145,
        lateArrivals: 2,
        absences: 1
      },
      status: 'active'
    });

    const staff2 = await Staff.create({
      user: user4._id,
      company: company1._id,
      branch: branch1._id,
      employeeId: 'EMP002',
      staffType: 'monthly',
      designation: 'Video Editor',
      department: 'Post Production',
      joiningDate: new Date('2023-03-20'),
      salary: {
        basic: 38000,
        allowances: 4000,
        total: 42000
      },
      performance: {
        score: 88,
        totalTasks: 120,
        completedTasks: 115,
        lateArrivals: 5,
        absences: 2
      },
      status: 'active'
    });

    // Create demo clients
    const client1 = await Client.create({
      company: company1._id,
      branch: branch1._id,
      name: 'Rajesh Agarwal',
      phone: '+91 9876543220',
      email: 'rajesh.agarwal@gmail.com',
      address: {
        street: '10 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002'
      },
      gstStatus: 'with_gst',
      gstNumber: '27ABCDE1234F1Z7',
      category: 'individual',
      status: 'active'
    });

    const client2 = await Client.create({
      company: company1._id,
      branch: branch1._id,
      name: 'Sunita Verma',
      phone: '+91 9876543221',
      email: 'sunita.verma@gmail.com',
      address: {
        street: '25 Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      gstStatus: 'without_gst',
      category: 'individual',
      status: 'active'
    });

    const client3 = await Client.create({
      company: company1._id,
      branch: branch2._id,
      name: 'ABC Corporation',
      phone: '+91 9876543222',
      email: 'events@abccorp.com',
      address: {
        street: '100 Andheri Kurla Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400059'
      },
      gstStatus: 'with_gst',
      gstNumber: '27ABCDE1234F1Z8',
      category: 'corporate',
      status: 'active'
    });

    // Create demo inventory items
    const inventory1 = await Inventory.create({
      company: company1._id,
      branch: branch1._id,
      name: 'Canon EOS R5',
      sku: 'CAM001',
      category: 'Camera',
      brand: 'Canon',
      model: 'EOS R5',
      description: 'Full-frame mirrorless camera with 45MP sensor',
      quantity: 2,
      minQuantity: 1,
      maxQuantity: 5,
      unit: 'pieces',
      purchasePrice: 250000,
      sellingPrice: 280000,
      supplier: {
        name: 'Canon India',
        contact: 'Mr. Sharma',
        email: 'sales@canonindia.com',
        phone: '+91 9876543230'
      },
      status: 'available'
    });

    const inventory2 = await Inventory.create({
      company: company1._id,
      branch: branch1._id,
      name: 'DJI Ronin-S2',
      sku: 'GIM001',
      category: 'Gimbal',
      brand: 'DJI',
      model: 'Ronin-S2',
      description: '3-axis gimbal stabilizer for DSLR cameras',
      quantity: 3,
      minQuantity: 1,
      maxQuantity: 4,
      unit: 'pieces',
      purchasePrice: 45000,
      sellingPrice: 52000,
      supplier: {
        name: 'DJI Store',
        contact: 'Ms. Patel',
        email: 'sales@djistore.com',
        phone: '+91 9876543231'
      },
      status: 'available'
    });

    const inventory3 = await Inventory.create({
      company: company1._id,
      branch: branch1._id,
      name: 'Godox AD600 Pro',
      sku: 'LIGHT001',
      category: 'Lighting',
      brand: 'Godox',
      model: 'AD600 Pro',
      description: '600W battery-powered strobe light',
      quantity: 4,
      minQuantity: 2,
      maxQuantity: 6,
      unit: 'pieces',
      purchasePrice: 35000,
      sellingPrice: 42000,
      supplier: {
        name: 'Godox India',
        contact: 'Mr. Kumar',
        email: 'sales@godoxindia.com',
        phone: '+91 9876543232'
      },
      status: 'available'
    });

    // Create demo attendance records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await Attendance.create({
      staff: staff1._id,
      company: company1._id,
      branch: branch1._id,
      date: today,
      checkIn: {
        time: new Date(today.setHours(9, 0, 0, 0)),
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Mumbai Central, Mumbai'
        }
      },
      status: 'present',
      workingHours: 8,
      overtime: 0
    });

    await Attendance.create({
      staff: staff2._id,
      company: company1._id,
      branch: branch1._id,
      date: today,
      checkIn: {
        time: new Date(today.setHours(9, 15, 0, 0)),
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Mumbai Central, Mumbai'
        }
      },
      status: 'late',
      workingHours: 7.75,
      overtime: 0
    });

    await Attendance.create({
      staff: staff1._id,
      company: company1._id,
      branch: branch1._id,
      date: yesterday,
      checkIn: {
        time: new Date(yesterday.setHours(9, 0, 0, 0)),
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Mumbai Central, Mumbai'
        }
      },
      checkOut: {
        time: new Date(yesterday.setHours(18, 0, 0, 0)),
        photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          address: 'Mumbai Central, Mumbai'
        }
      },
      status: 'present',
      workingHours: 9,
      overtime: 1
    });

    console.log('Demo data created successfully!');
    console.log('Companies:', await Company.countDocuments());
    console.log('Branches:', await Branch.countDocuments());
    console.log('Users:', await User.countDocuments());
    console.log('Staff:', await Staff.countDocuments());
    console.log('Clients:', await Client.countDocuments());
    console.log('Inventory Items:', await Inventory.countDocuments());
    console.log('Attendance Records:', await Attendance.countDocuments());

  } catch (error) {
    console.error('Error creating demo data:', error);
  } finally {
    mongoose.connection.close();
  }
};

createDemoData(); 