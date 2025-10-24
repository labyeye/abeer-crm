const express = require('express');
const router = express.Router();
const {
  getAllClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientBookings,
  getClientInvoices,
  getClientSummary,
  searchClients
} = require('../controller/clientController');
const { protect, authorize } = require('../middleware/auth');


router.use(protect);



router.route('/')
  .get(authorize('chairman', 'company_admin', 'branch_admin', 'staff'), getAllClients)
  .post(authorize('chairman', 'company_admin', 'branch_admin'), createClient);

router.route('/search/:query')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), searchClients);


router.route('/:id')
  .get(authorize('chairman', 'company_admin', 'branch_admin', 'staff'), getClient)
  .put(authorize('chairman', 'company_admin', 'branch_admin'), updateClient)
  .delete(authorize('chairman', 'company_admin'), deleteClient);

router.route('/:id/bookings')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientBookings);


router.route('/:id/invoices')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientInvoices);

router.route('/:id/summary')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientSummary);

// Get client advance balance
router.route('/:id/advance')
  .get(authorize('chairman', 'company_admin', 'branch_admin', 'staff'), async (req, res) => {
    try {
      const Client = require('../models/Client');
      const client = await Client.findById(req.params.id).select('advanceBalance name');
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      res.json({ 
        success: true, 
        data: { 
          advanceBalance: client.advanceBalance || 0,
          clientName: client.name
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

module.exports = router; 