const cron = require('node-cron');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const automatedMessaging = require('./automatedMessaging');

class AutomationScheduler {
  constructor() {
    this.isRunning = false;
  }

  


  start() {
    if (this.isRunning) {
      console.log('Automation scheduler is already running');
      return;
    }

    console.log('Starting automation scheduler...');
    this.isRunning = true;

    
    // Quotation follow-ups removed - functionality handled via bookings

    
    cron.schedule('0 11 * * *', () => {
      this.checkPaymentReminders();
    });

    
    cron.schedule('0 14 * * *', () => {
      this.checkPhotoSelectionReminders();
    });

    
    cron.schedule('0 9 * * *', () => {
      this.checkAppointmentReminders();
    });

    
    cron.schedule('0 * * * *', () => {
      this.processPendingNotifications();
    });

    
    cron.schedule('0 0 * * *', () => {
      this.cleanupExpiredLinks();
    });

    console.log('Automation scheduler started successfully');
  }

  


  stop() {
    cron.destroy();
    this.isRunning = false;
    console.log('Automation scheduler stopped');
  }

  


  // Quotation follow-ups removed

  


  async checkPaymentReminders() {
    try {
      console.log('Checking payment reminders...');
      
      const today = new Date();
      
      
      const overdueInvoices = await Invoice.find({
        dueDate: { $lt: today },
        status: { $in: ['pending', 'partial'] },
        isDeleted: false
      })
      .populate('client company branch');

      for (const invoice of overdueInvoices) {
        
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

  


  async checkPhotoSelectionReminders() {
    try {
      console.log('Checking photo selection reminders...');
      
      
      
      
      
      
      console.log('Photo selection reminders check completed');
    } catch (error) {
      console.error('Error checking photo selection reminders:', error);
    }
  }

  


  async checkAppointmentReminders() {
    try {
      console.log('Checking appointment reminders...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      
      // Appointment reminders for quotations removed
    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }

  


  async processPendingNotifications() {
    try {
      console.log('Processing pending notifications...');
      
      const pendingNotifications = await Notification.find({
        status: 'pending',
        scheduledFor: { $lte: new Date() },
        retryCount: { $lt: 3 }
      }).limit(50); 

      for (const notification of pendingNotifications) {
        try {
          
          
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

  


  async runManualCheck(type) {
    switch (type) {
      // quotation follow-ups removed
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

  


  getStatus() {
    return {
      isRunning: this.isRunning,
      nextSchedule: {
  // quotationFollowUps removed
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
