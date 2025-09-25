const mongoose = require('mongoose');

const ServiceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  // new field: list of types/sub-types for the service (e.g., ['candid','portrait'])
  types: { type: [String], default: [] },
  // keep legacy single-type field for compatibility (optional)
  type: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', ServiceCategorySchema);
