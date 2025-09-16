const mongoose = require('mongoose');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Branch = require('../models/Branch');

async function createMissingStaffRecords() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/abeer-crm');
    console.log('✅ Database connected');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`👥 Found ${staffUsers.length} staff users`);
    
    // Get default branch (first available branch)
    const defaultBranch = await Branch.findOne();
    if (!defaultBranch) {
      console.log('❌ No branch found. Please create a branch first.');
      process.exit(1);
    }
    
    let createdCount = 0;
    
    for (const user of staffUsers) {
      // Check if staff record already exists
      const existingStaff = await Staff.findOne({ user: user._id });
      
      if (!existingStaff) {
        console.log(`➕ Creating staff record for: ${user.name} (${user.email})`);
        
        // Generate employee ID
        const employeeId = `EMP${Date.now().toString().slice(-6)}`;
        
        // Create staff record
        await Staff.create({
          user: user._id,
          branch: defaultBranch._id,
          name: user.name,
          phone: user.phone || '0000000000',
          address: {
            street: 'Not provided',
            city: 'Not provided',
            state: 'Not provided',
            pincode: '000000'
          },
          fatherName: 'Not provided',
          motherName: 'Not provided',
          aadharNumbers: {
            staff: '000000000000',
            father: '000000000000',
            mother: '000000000000'
          },
          contacts: {
            staff: user.phone || '0000000000',
            father: '0000000000',
            mother: '0000000000'
          },
          employeeId: employeeId,
          designation: 'Staff',
          department: 'General',
          joiningDate: new Date(),
          salary: 15000,
          staffType: 'monthly'
        });
        
        createdCount++;
        console.log(`✅ Created staff record for: ${user.name} with Employee ID: ${employeeId}`);
      } else {
        console.log(`⏭️ Staff record already exists for: ${user.name}`);
      }
    }
    
    console.log(`\n🎉 Process completed! Created ${createdCount} new staff records.`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createMissingStaffRecords();