const ServiceCategory = require('../models/ServiceCategory');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, types, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const normalizedTypes = Array.isArray(types) ? types.filter(Boolean) : (type ? [type] : []);
    const cat = await ServiceCategory.create({ name, types: normalizedTypes, type: type || (normalizedTypes[0] || '') });
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, types, type } = req.body;
    if (!id) return res.status(400).json({ message: 'Category id is required' });
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const normalizedTypes = Array.isArray(types) ? types.filter(Boolean) : (type ? [type] : []);
    const updated = await ServiceCategory.findByIdAndUpdate(id, { name, types: normalizedTypes, type: type || (normalizedTypes[0] || '') }, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ServiceCategory.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
