const express = require('express');
const router = express.Router();
const {
  getAllClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientBookings,
  getClientQuotations,
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

router.route('/:id/quotations')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientQuotations);

router.route('/:id/invoices')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientInvoices);

router.route('/:id/summary')
  .get(authorize('chairman', 'company_admin', 'branch_admin'), getClientSummary);

module.exports = router; 