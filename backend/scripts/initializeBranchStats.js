const mongoose = require('mongoose');
const { updateAllBranchesStats } = require('../utils/branchUtils');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const initializeBranchStats = async () => {
  try {
    console.log('Starting branch stats initialization...');
    
    // Update all branches stats
    await updateAllBranchesStats();
    
    console.log('Branch stats initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing branch stats:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeBranchStats();
