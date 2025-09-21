const cron = require('node-cron');
const Notification = require('../models/Notification');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const automatedMessaging = require('./automatedMessaging');

class FollowUpSchedulerService {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) return;
    
    console.log('Starting Follow-up Scheduler...');
    
    // Run every hour to check for pending follow-ups
    this.mainJob = cron.schedule('0 * * * *', async () => {
      await this.processScheduledFollowUps();
    }, { scheduled: false });

    // Run every day at 9 AM for quotation follow-ups
    this.quotationFollowUpJob = cron.schedule('0 9 * * *', async () => {
      await this.processQuotationFollowUps();
    }, { scheduled: false });

    // Run every day at 11 AM for payment reminders
    this.paymentReminderJob = cron.schedule('0 11 * * *', async () => {
      await this.processPaymentReminders();
    }, { scheduled: false });

    // Run every week for photo selection reminders
    this.photoReminderJob = cron.schedule('0 10 * * 1', async () => {
      await this.processPhotoSelectionReminders();
    }, { scheduled: false });

    this.mainJob.start();
    this.quotationFollowUpJob.start();
    this.paymentReminderJob.start();
    this.photoReminderJob.start();

    this.isRunning = true;
    console.log('Follow-up Scheduler started successfully!');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) return;
    
    this.mainJob?.stop();
    this.quotationFollowUpJob?.stop();
    this.paymentReminderJob?.stop();
    this.photoReminderJob?.stop();
    
    // Clear all scheduled jobs
    this.scheduledJobs.forEach(job => job.destroy());
    this.scheduledJobs.clear();
    
    this.isRunning = false;
    console.log('Follow-up Scheduler stopped.');
  }

  /**
   * Process all scheduled follow-ups
   */
  async processScheduledFollowUps() {
    try {
      const now = new Date();
      
      // Find notifications that need follow-up
      const pendingFollowUps = await Notification.find({
        'automation.isAutomated': true,
        'automation.nextFollowUp': { $lte: now },
        status: { $nin: ['delivered', 'read', 'failed'] },
        isDeleted: false
      });

      console.log(`Processing ${pendingFollowUps.length} scheduled follow-ups...`);

      for (const notification of pendingFollowUps) {
        await this.processIndividualFollowUp(notification);
      }
    } catch (error) {
      console.error('Error processing scheduled follow-ups:', error);
    }
  }

  /**
   * Process individual follow-up
   */
  async processIndividualFollowUp(notification) {
    try {
      switch (notification.automation.trigger) {
        case 'quotation_created':
          await this.handleQuotationFollowUp(notification);
          break;
        case 'payment_due':
          await this.handlePaymentReminder(notification);
          break;
        case 'photo_selection':
          await this.handlePhotoSelectionReminder(notification);
          break;
        default:
          console.log(`Unknown follow-up trigger: ${notification.automation.trigger}`);
      }
    } catch (error) {
      console.error(`Error processing follow-up for notification ${notification._id}:`, error);
    }
  }

  /**
   * Handle quotation follow-up after 7 days
   */
  async handleQuotationFollowUp(notification) {
    try {
      // Check if quotation still exists and is pending
      const quotation = await Quotation.findById(notification.relatedTo.quotation)
        .populate('client company branch');

      if (!quotation || quotation.status !== 'pending') {
        // Mark notification as completed if quotation is no longer pending
        notification.status = 'completed';
        await notification.save();
        return;
      }

      // Send 7-day follow-up
      await automatedMessaging.sendQuotationFollowUp({
        client: quotation.client,
        quotation: quotation,
        company: quotation.company,
        branch: quotation.branch
      });

      // Schedule next follow-up in another 7 days
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      
      notification.automation.nextFollowUp = nextFollowUp;
      notification.status = 'sent';
      await notification.save();

      console.log(`Quotation follow-up sent for: ${quotation.quotationNumber}`);
    } catch (error) {
      console.error('Error handling quotation follow-up:', error);
    }
  }

  /**
   * Process quotation follow-ups (7 days after creation)
   */
  async processQuotationFollowUps() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Find quotations created 7 days ago that are still pending
      const quotationsNeedingFollowUp = await Quotation.find({
        createdAt: {
          $gte: new Date(sevenDaysAgo.setHours(0, 0, 0, 0)),
          $lt: new Date(sevenDaysAgo.setHours(23, 59, 59, 999))
        },
        status: 'pending',
        isDeleted: false
      })
      .populate('client company branch');

      console.log(`Found ${quotationsNeedingFollowUp.length} quotations needing 7-day follow-up`);

      for (const quotation of quotationsNeedingFollowUp) {
        // Check if follow-up already sent
        const existingFollowUp = await Notification.findOne({
          'relatedTo.quotation': quotation._id,
          type: 'quotation_followup_7days'
        });

        if (!existingFollowUp) {
          await automatedMessaging.sendQuotationFollowUp({
            client: quotation.client,
            quotation: quotation,
            company: quotation.company,
            branch: quotation.branch
          });
        }
      }
    } catch (error) {
      console.error('Error processing quotation follow-ups:', error);
    }
  }

  /**
   * Process payment reminders
   */
  async processPaymentReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find invoices with due dates today
      const Invoice = require('../models/Invoice');
      const overdueInvoices = await Invoice.find({
        dueDate: { $lte: today },
        status: { $nin: ['paid', 'cancelled'] },
        isDeleted: false
      })
      .populate('client company branch');

      console.log(`Found ${overdueInvoices.length} invoices needing payment reminders`);

      for (const invoice of overdueInvoices) {
        // Check if reminder already sent today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingReminder = await Notification.findOne({
          'relatedTo.invoice': invoice._id,
          type: 'payment_reminder',
          createdAt: { $gte: todayStart, $lte: todayEnd }
        });

        if (!existingReminder) {
          await automatedMessaging.sendPaymentReminder({
            client: invoice.client,
            invoice: invoice,
            company: invoice.company,
            branch: invoice.branch,
            dueTime: '6:00 PM'
          });
        }
      }
    } catch (error) {
      console.error('Error processing payment reminders:', error);
    }
  }

  /**
   * Process photo selection reminders
   */
  async processPhotoSelectionReminders() {
    try {
      // Find bookings where work is delivered but photos not selected
      const bookingsNeedingPhotoSelection = await Booking.find({
        status: 'delivered',
        'photoSelection.isCompleted': false,
        'photoSelection.reminderSent': { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last reminder sent more than 7 days ago
        isDeleted: false
      })
      .populate('client company branch');

      console.log(`Found ${bookingsNeedingPhotoSelection.length} bookings needing photo selection reminders`);

      for (const booking of bookingsNeedingPhotoSelection) {
        // Send photo selection reminder
        const smartLink = automatedMessaging.createSmartLink('photo_selection', { bookingId: booking._id });
        
        // This would integrate with the photo selection system
        await automatedMessaging.sendPhotoSelectionReminder({
          client: booking.client,
          booking: booking,
          company: booking.company,
          branch: booking.branch,
          link: smartLink.url,
          pageCount: booking.photoSelection?.totalPages || 50,
          lastDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('hi-IN')
        });

        // Update reminder sent timestamp
        booking.photoSelection = booking.photoSelection || {};
        booking.photoSelection.reminderSent = new Date();
        await booking.save();
      }
    } catch (error) {
      console.error('Error processing photo selection reminders:', error);
    }
  }

  /**
   * Schedule a custom follow-up
   */
  scheduleCustomFollowUp(notificationId, followUpDate, callback) {
    const jobId = `followup_${notificationId}`;
    
    // Remove existing job if any
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId).destroy();
    }

    // Schedule new job
    const job = cron.schedule('* * * * *', async () => {
      const now = new Date();
      if (now >= followUpDate) {
        try {
          await callback();
          job.destroy();
          this.scheduledJobs.delete(jobId);
        } catch (error) {
          console.error(`Error in custom follow-up ${jobId}:`, error);
        }
      }
    }, { scheduled: false });

    this.scheduledJobs.set(jobId, job);
    job.start();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.scheduledJobs.size,
      uptime: this.isRunning ? process.uptime() : 0
    };
  }
}

module.exports = new FollowUpSchedulerService();
