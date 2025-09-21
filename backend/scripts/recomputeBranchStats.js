require('dotenv').config({ path: './config/config.env' });
const connectDB = require('../config/db');
const { updateBranchStats, computeBranchRevenueBreakdown } = require('../utils/branchUtils');

const branchId = process.argv[2] || '68c68b7aa267bbe2bdf00cd1'; // default branch id

(async () => {
  try {
    await connectDB();
  console.log('Connected to DB. Recomputing stats for branch:', branchId);
  await updateBranchStats(branchId);
  const breakdown = await computeBranchRevenueBreakdown(branchId);
  console.log('Recomputed branch stats. Breakdown:', breakdown);
    process.exit(0);
  } catch (err) {
    console.error('Error during recompute:', err);
    process.exit(1);
  }
})();
