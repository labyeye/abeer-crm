const cron = require('node-cron');
const Notification = require('../models/Notification');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const automatedMessaging = require('./automatedMessaging');

class AutomationScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) {
      console.log('Automation scheduler is already running');
      return;
    }

    console.log('Starting automation scheduler...');
    this.isRunning = true;

    // Check for 7-day quotation follow-ups every day at 10:00 AM
    cron.schedule('0 10 * * *', () => {
      this.checkQuotationFollowUps();
    });

    // Check for payment reminders every day at 11:00 AM
    cron.schedule('0 11 * * *', () => {
      this.checkPaymentReminders();
    });

    // Check for photo selection reminders every day at 2:00 PM
    cron.schedule('0 14 * * *', () => {
      this.checkPhotoSelectionReminders();
    });

    // Check for appointment reminders every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
      this.checkAppointmentReminders();
    });

    // Process pending notifications every hour
    cron.schedule('0 * * * *', () => {
      this.processPendingNotifications();
    });

    // Clean up expired smart links every day at midnight
    cron.schedule('0 0 * * *', () => {
      this.cleanupExpiredLinks();
    });

    console.log('Automation scheduler started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    cron.destroy();
    this.isRunning = false;
    console.log('Automation scheduler stopped');
  }

  /**
   * Check for quotations that need 7-day follow-up
   */
  async checkQuotationFollowUps() {
    try {
      console.log('Checking quotation follow-ups...');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Find quotations created 7 days ago that haven't been converted or followed up
      const quotations = await Quotation.find({
        createdAt: {
          $gte: new Date(sevenDaysAgo.setHours(0, 0, 0, 0)),
          $lt: new Date(sevenDaysAgo.setHours(23, 59, 59, 999))
        },
        status: 'pending',
        lastFollowUp: { $exists: false },
        isDeleted: false
      })
      .populate('client company branch');

      for (const quotation of quotations) {
        // Check if follow-up notification already sent today
        const existingFollowUp = await Notification.findOne({
          'relatedTo.quotation': quotation._id,
          type: 'quotation_followup_7days',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        });

        if (!existingFollowUp) {
          await automatedMessaging.sendQuotationFollowUp({
            client: quotation.client,
            quotation: quotation,
            company: quotation.company,
            branch: quotation.branch
          });

          // Update quotation with follow-up date
          quotation.lastFollowUp = new Date();
          await quotation.save();
        }
      }
      
      console.log(`Processed ${quotations.length} quotation follow-ups`);
    } catch (error) {
      console.error('Error checking quotation follow-ups:', error);
    }
  }

  /**
   * Check for payment reminders
   */
  async checkPaymentReminders() {
    try {
      console.log('Checking payment reminders...');
      
      const today = new Date();
      
      // Find overdue invoices
      const overdueInvoices = await Invoice.find({
        dueDate: { $lt: today },
        status: { $in: ['pending', 'partial'] },
        isDeleted: false
      })
      .populate('client company branch');

      for (const invoice of overdueInvoices) {
        // Check if reminder already sent today
        const existingReminder = await Notification.findOne({
          'relatedTo.invoice': invoice._id,
          type: 'payment_reminder',
          createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0))
          }
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
      
      console.log(`Processed ${overdueInvoices.length} payment reminders`);
    } catch (error) {
      console.error('Error checking payment reminders:', error);
    }
  }

  /**
   * Check for photo selection reminders
   */
  async checkPhotoSelectionReminders() {
    try {
      console.log('Checking photo selection reminders...');
      
      // This would typically check for bookings where photos are ready
      // but client hasn't selected them yet
      // Implementation depends on photo management system
      
      // Placeholder for photo selection reminder logic
      console.log('Photo selection reminders check completed');
    } catch (error) {
      console.error('Error checking photo selection reminders:', error);
    }
  }

  /**
   * Check for appointment reminders
   */
  async checkAppointmentReminders() {
    try {
      console.log('Checking appointment reminders...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Find bookings scheduled for tomorrow
      const upcomingBookings = await Quotation.find({
        'appointmentDetails.date': {
          $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
          $lt: new Date(tomorrow.setHours(23, 59, 59, 999))
        },
        status: 'approved',
        isDeleted: false
      })
      .populate('client company branch');

      for (const quotation of upcomingBookings) {
        // Check if reminder already sent
        const existingReminder = await Notification.findOne({
          'relatedTo.quotation': quotation._id,
          type: 'appointment_reminder',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        });

        if (!existingReminder && quotation.appointmentDetails) {
          // Send appointment reminder (implement based on your message template)
          // This is a simplified version
          console.log(`Appointment reminder needed for quotation ${quotation.quotationNumber}`);
        }
      }
      
      console.log(`Processed ${upcomingBookings.length} appointment reminders`);
    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications() {
    try {
      console.log('Processing pending notifications...');
      
      const pendingNotifications = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() },
        retryCount: { $lt: 3 }
      }).limit(50); // Process in batches

      for (const notification of pendingNotifications) {
        try {
          // Here you would integrate with actual SMS/WhatsApp/Email services
          // For now, we'll just mark as sent
          notification.status = 'sent';
          notification.sentAt = new Date();
          await notification.save();
          
          console.log(`Processed notification ${notification._id}`);
        } catch (error) {
          notification.retryCount += 1;
          notification.status = notification.retryCount >= 3 ? 'failed' : 'pending';
          await notification.save();
          
          console.error(`Failed to process notification ${notification._id}:`, error);
        }
      }
      
      console.log(`Processed ${pendingNotifications.length} pending notifications`);
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Clean up expired smart links
   */
  async cleanupExpiredLinks() {
    try {
      console.log('Cleaning up expired smart links...');
      
      const result = await Notification.updateMany(
        {
          'smartLink.expiresAt': { $lt: new Date() },
          'smartLink.isActive': true
        },
        {
          $set: { 'smartLink.isActive': false }
        }
      );
      
      console.log(`Deactivated ${result.modifiedCount} expired smart links`);
    } catch (error) {
      console.error('Error cleaning up expired links:', error);
    }
  }

  /**
   * Manually trigger a specific automation check
   */
  async runManualCheck(type) {
    switch (type) {
      case 'quotation_followups':
        await this.checkQuotationFollowUps();
        break;
      case 'payment_reminders':
        await this.checkPaymentReminders();
        break;
      case 'photo_reminders':
        await this.checkPhotoSelectionReminders();
        break;
      case 'appointment_reminders':
        await this.checkAppointmentReminders();
        break;
      case 'pending_notifications':
        await this.processPendingNotifications();
        break;
      default:
        throw new Error('Invalid automation type');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextSchedule: {
        quotationFollowUps: '10:00 AM daily',
        paymentReminders: '11:00 AM daily',
        photoReminders: '2:00 PM daily',
        appointmentReminders: '9:00 AM daily',
        notificationProcessing: 'Every hour',
        linkCleanup: 'Midnight daily'
      }
    };
  }
}

module.exports = new AutomationScheduler();
