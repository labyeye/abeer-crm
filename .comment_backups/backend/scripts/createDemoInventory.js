const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config/config.env' });
dotenv.config(); // Also try loading from .env file in root

const demoInventory = [
  {
    name: 'Canon EOS R5',
    sku: 'CAM-CAN-R5-001',
    category: 'Camera',
    subcategory: 'Mirrorless',
    brand: 'Canon',
    model: 'EOS R5',
    description: 'Full-frame mirrorless camera with 45MP sensor and 8K video capability',
    condition: 'Excellent',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'A1',
      bin: 'B01'
    },
    quantity: 3,
    minQuantity: 1,
    maxQuantity: 5,
    unit: 'Piece',
    purchasePrice: 3899,
    sellingPrice: 4200,
    supplier: {
      name: 'Canon USA',
      contact: 'John Smith',
      email: 'sales@canonusa.com',
      phone: '+1 (800) 385-2155'
    },
    status: 'Active',
    tags: ['camera', 'mirrorless', 'full-frame', '8K']
  },
  {
    name: 'Sony 24-70mm f/2.8 GM Lens',
    sku: 'LEN-SON-2470-001',
    category: 'Lens',
    subcategory: 'Zoom',
    brand: 'Sony',
    model: 'FE 24-70mm f/2.8 GM',
    description: 'Professional zoom lens for Sony E-mount cameras',
    condition: 'Like New',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'A2',
      bin: 'B02'
    },
    quantity: 2,
    minQuantity: 1,
    maxQuantity: 3,
    unit: 'Piece',
    purchasePrice: 2198,
    sellingPrice: 2400,
    supplier: {
      name: 'Sony Electronics',
      contact: 'Sarah Johnson',
      email: 'pro@sony.com',
      phone: '+1 (800) 222-7669'
    },
    status: 'Active',
    tags: ['lens', 'zoom', 'professional', 'f2.8']
  },
  {
    name: 'Profoto B10X Plus',
    sku: 'LIT-PRO-B10X-001',
    category: 'Lighting',
    subcategory: 'Flash',
    brand: 'Profoto',
    model: 'B10X Plus',
    description: '500Ws battery-powered flash with TTL capability',
    condition: 'Good',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'B1',
      bin: 'B03'
    },
    quantity: 4,
    minQuantity: 2,
    maxQuantity: 6,
    unit: 'Piece',
    purchasePrice: 1695,
    sellingPrice: 1800,
    supplier: {
      name: 'Profoto',
      contact: 'Mike Chen',
      email: 'sales@profoto.com',
      phone: '+1 (800) 223-1438'
    },
    status: 'Active',
    tags: ['lighting', 'flash', 'battery', 'TTL']
  },
  {
    name: 'Rode NTG5 Shotgun Microphone',
    sku: 'AUD-ROD-NTG5-001',
    category: 'Audio',
    subcategory: 'Microphone',
    brand: 'Rode',
    model: 'NTG5',
    description: 'Professional shotgun microphone for video production',
    condition: 'New',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'C1',
      bin: 'B04'
    },
    quantity: 6,
    minQuantity: 3,
    maxQuantity: 8,
    unit: 'Piece',
    purchasePrice: 699,
    sellingPrice: 750,
    supplier: {
      name: 'Rode Microphones',
      contact: 'Lisa Wang',
      email: 'sales@rode.com',
      phone: '+61 2 9765 1111'
    },
    status: 'Active',
    tags: ['audio', 'microphone', 'shotgun', 'professional']
  },
  {
    name: 'Manfrotto MT055 Tripod',
    sku: 'TRI-MAN-MT055-001',
    category: 'Tripod',
    subcategory: 'Professional',
    brand: 'Manfrotto',
    model: 'MT055',
    description: 'Professional aluminum tripod with fluid head',
    condition: 'Good',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'D1',
      bin: 'B05'
    },
    quantity: 2,
    minQuantity: 1,
    maxQuantity: 4,
    unit: 'Piece',
    purchasePrice: 899,
    sellingPrice: 950,
    supplier: {
      name: 'Manfrotto',
      contact: 'David Brown',
      email: 'sales@manfrotto.com',
      phone: '+1 (800) 777-4883'
    },
    status: 'Active',
    tags: ['tripod', 'professional', 'fluid-head', 'aluminum']
  },
  {
    name: 'DJI RS 3 Pro Gimbal',
    sku: 'ACC-DJI-RS3P-001',
    category: 'Accessories',
    subcategory: 'Stabilizer',
    brand: 'DJI',
    model: 'RS 3 Pro',
    description: 'Professional 3-axis gimbal stabilizer for cameras',
    condition: 'Excellent',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'E1',
      bin: 'B06'
    },
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 2,
    unit: 'Piece',
    purchasePrice: 869,
    sellingPrice: 900,
    supplier: {
      name: 'DJI',
      contact: 'Alex Rodriguez',
      email: 'sales@dji.com',
      phone: '+1 (800) 856-4353'
    },
    status: 'Active',
    tags: ['gimbal', 'stabilizer', '3-axis', 'professional']
  },
  {
    name: 'Backdrop Stand Kit',
    sku: 'PRO-BAC-STAND-001',
    category: 'Props',
    subcategory: 'Backdrop',
    brand: 'Generic',
    model: 'Professional Stand Kit',
    description: '10ft backdrop stand with crossbar and carrying case',
    condition: 'Good',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'F1',
      bin: 'B07'
    },
    quantity: 8,
    minQuantity: 4,
    maxQuantity: 10,
    unit: 'Set',
    purchasePrice: 89,
    sellingPrice: 120,
    supplier: {
      name: 'Backdrop Express',
      contact: 'Emma Wilson',
      email: 'sales@backdropexpress.com',
      phone: '+1 (800) 566-9174'
    },
    status: 'Active',
    tags: ['backdrop', 'stand', 'kit', 'portrait']
  },
  {
    name: 'Adobe Creative Cloud',
    sku: 'SOF-ADO-CC-001',
    category: 'Software',
    subcategory: 'Creative Suite',
    brand: 'Adobe',
    model: 'Creative Cloud',
    description: 'Annual subscription to Adobe Creative Cloud',
    condition: 'New',
    location: {
      warehouse: 'Digital',
      shelf: 'Virtual',
      bin: 'Cloud'
    },
    quantity: 15,
    minQuantity: 5,
    maxQuantity: 20,
    unit: 'License',
    purchasePrice: 599,
    sellingPrice: 650,
    supplier: {
      name: 'Adobe',
      contact: 'Digital Sales',
      email: 'sales@adobe.com',
      phone: '+1 (800) 833-6687'
    },
    status: 'Active',
    tags: ['software', 'creative', 'subscription', 'annual']
  },
  {
    name: 'Memory Card 128GB',
    sku: 'ACC-MEM-128GB-001',
    category: 'Accessories',
    subcategory: 'Storage',
    brand: 'SanDisk',
    model: 'Extreme Pro',
    description: '128GB UHS-I SDXC memory card with 170MB/s read speed',
    condition: 'New',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'G1',
      bin: 'B08'
    },
    quantity: 25,
    minQuantity: 10,
    maxQuantity: 50,
    unit: 'Piece',
    purchasePrice: 45,
    sellingPrice: 60,
    supplier: {
      name: 'SanDisk',
      contact: 'Storage Sales',
      email: 'sales@sandisk.com',
      phone: '+1 (800) 578-6007'
    },
    status: 'Active',
    tags: ['memory', 'storage', 'SD', 'fast']
  },
  {
    name: 'Camera Battery Pack',
    sku: 'ACC-BAT-CAM-001',
    category: 'Accessories',
    subcategory: 'Battery',
    brand: 'Generic',
    model: 'LP-E6NH Compatible',
    description: 'Replacement battery for Canon cameras',
    condition: 'New',
    location: {
      warehouse: 'Main Warehouse',
      shelf: 'H1',
      bin: 'B09'
    },
    quantity: 12,
    minQuantity: 5,
    maxQuantity: 20,
    unit: 'Piece',
    purchasePrice: 35,
    sellingPrice: 45,
    supplier: {
      name: 'Battery World',
      contact: 'Power Sales',
      email: 'sales@batteryworld.com',
      phone: '+1 (800) 123-4567'
    },
    status: 'Active',
    tags: ['battery', 'camera', 'replacement', 'compatible']
  }
];

const createDemoInventory = async () => {
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

    // Clear existing demo inventory
    await Inventory.deleteMany({
      sku: { $in: demoInventory.map(item => item.sku) }
    });
    console.log('Cleared existing demo inventory...');

    // Add createdBy field to all inventory items
    const inventoryWithCreator = demoInventory.map(item => ({
      ...item,
      createdBy: chairman._id
    }));

    // Create new demo inventory items
    const createdInventory = await Inventory.create(inventoryWithCreator);
    
    console.log('✅ Demo inventory created successfully!');
    console.log('\n📋 Created Inventory Items:');
    createdInventory.forEach(item => {
      console.log(`   📦 ${item.name}`);
      console.log(`      🏷️  SKU: ${item.sku}`);
      console.log(`      🏭 Category: ${item.category}`);
      console.log(`      📊 Quantity: ${item.quantity} ${item.unit}`);
      console.log(`      💰 Value: $${(item.quantity * item.purchasePrice).toLocaleString()}`);
      console.log('');
    });

    console.log('🎉 You can now test the inventory management system!');
    
  } catch (error) {
    console.error('❌ Error creating demo inventory:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createDemoInventory(); 