const crypto = require('crypto');
const Notification = require('../models/Notification');
const { getMessage, generateSmartLink } = require('./messageTemplates');

class AutomatedMessagingService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  


  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  


  createSmartLink(type, relatedData = {}) {
    const token = this.generateToken();
    const url = generateSmartLink(this.baseUrl, token, type);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); 

    return {
      token,
      url,
      expiresAt,
      accessCount: 0,
      maxAccess: 10,
      isActive: true
    };
  }

  


  async sendQuotationCreated(quotationData) {
    const { client, quotation, company, branch } = quotationData;
    
    const smartLink = this.createSmartLink('quotation', { quotationId: quotation._id });
    
    const variables = {
      location: quotation.functionDetails?.venue?.name || 'स्थान',
      service: quotation.services?.[0]?.service || 'सेवा',
      link: smartLink.url
    };

    const notification = await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'quotation_created',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Quotation Ready',
      message: getMessage('quotation_created', variables),
      smartLink,
      relatedTo: {
        quotation: quotation._id
      },
      automation: {
        isAutomated: true,
        trigger: 'quotation_created',
        followUpDays: 7,
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      priority: 'high'
    });

    await this.scheduleFollowUp(notification, 7);
    return notification;
  }

  


  async sendQuotationFollowUp(quotationData) {
    const { client, quotation, company, branch } = quotationData;
    
    const smartLink = this.createSmartLink('quotation_followup', { quotationId: quotation._id });
    
    const variables = {
      link: smartLink.url
    };

    return await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'quotation_followup_7days',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Quotation Follow-up',
      message: getMessage('quotation_followup_7days', variables),
      smartLink,
      relatedTo: {
        quotation: quotation._id
      },
      automation: {
        isAutomated: true,
        trigger: 'followup_scheduled'
      },
      priority: 'medium'
    });
  }

  


  async sendBookingConfirmed(bookingData) {
    const { client, booking, company, branch, staffDetails } = bookingData;
    
    const smartLink = this.createSmartLink('booking', { bookingId: booking._id });
    
    
    const primaryFD = (Array.isArray(booking.functionDetailsList) && booking.functionDetailsList.length > 0)
      ? booking.functionDetailsList[0]
      : booking.functionDetails || {};

    const variables = {
      date: new Date(primaryFD.date).toLocaleDateString('hi-IN'),
      function: primaryFD.type,
      time: `${primaryFD.time?.start || ''} - ${primaryFD.time?.end || ''}`,
      venue: primaryFD.venue?.name || primaryFD.venue?.address || '',
      staffDetails: staffDetails || 'जल्द ही भेजी जाएगी',
      link: smartLink.url
    };

    const notification = await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'booking_confirmed',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Booking Confirmed',
      message: getMessage('booking_confirmed', variables),
      smartLink,
      relatedTo: {
        booking: booking._id
      },
      automation: {
        isAutomated: true,
        trigger: 'booking_confirmed'
      },
      priority: 'high'
    });

    
    if (booking.staffAssignment && booking.staffAssignment.length > 0) {
      await this.notifyAssignedStaff(booking, company, branch);
    }

    return notification;
  }

  


  async sendPaymentReminder(paymentData) {
    const { client, invoice, company, branch, dueTime } = paymentData;
    
    const smartLink = this.createSmartLink('payment', { invoiceId: invoice._id });
    
    const variables = {
      amount: invoice.finalAmount || invoice.total,
      time: dueTime || '6:00 PM',
      invoiceNumber: invoice.invoiceNumber,
      link: smartLink.url
    };

    return await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'payment_reminder',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Payment Reminder',
      message: getMessage('payment_reminder', variables),
      smartLink,
      relatedTo: {
        invoice: invoice._id
      },
      automation: {
        isAutomated: true,
        trigger: 'payment_due'
      },
      priority: 'high'
    });
  }

  


  async sendTaskAssigned(taskData) {
    const { staff, task, booking, company, branch } = taskData;
    
    const smartLink = this.createSmartLink('task', { taskId: task._id });
    
    const variables = {
      date: new Date(task.scheduledDate).toLocaleDateString('hi-IN'),
      time: `${task.scheduledTime?.start} - ${task.scheduledTime?.end}`,
      location: task.location?.address || booking.functionDetails?.venue?.address,
      client: booking.client?.name || 'Client',
      link: smartLink.url
    };

    const notifications = [];

    for (const staffMember of staff) {
      const notification = await Notification.create({
        company: company._id,
        branch: branch._id,
        type: 'task_assigned',
        recipient: {
          type: 'staff',
          staff: staffMember._id,
          user: staffMember.user,
          contact: {
            phone: staffMember.user?.phone,
            email: staffMember.user?.email
          }
        },
        title: 'New Task Assigned',
        message: getMessage('task_assigned', variables),
        smartLink,
        relatedTo: {
          task: task._id,
          booking: booking._id
        },
        automation: {
          isAutomated: true,
          trigger: 'task_assigned'
        },
        priority: 'high'
      });

      notifications.push(notification);
    }

    return notifications;
  }

  


  async sendStaffAssignment(assignmentData) {
    const { client, booking, staffList, equipmentList, company, branch } = assignmentData;
    
    const smartLink = this.createSmartLink('staff_assignment', { bookingId: booking._id });
    
    const teamMembers = staffList.map(s => s.user?.name).join(', ');
    const equipment = equipmentList.map(e => e.name).join(', ');
    const contact = staffList[0]?.user?.phone || company.phone;

    const variables = {
      teamMembers,
      equipment,
      contact,
      link: smartLink.url
    };

    return await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'staff_assignment',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Staff Assigned',
      message: getMessage('staff_assignment', variables),
      smartLink,
      relatedTo: {
        booking: booking._id
      },
      automation: {
        isAutomated: true,
        trigger: 'task_assigned'
      },
      priority: 'medium'
    });
  }

  


  async sendTaskSkipped(skipData) {
    const { client, task, problem, company, branch, contact } = skipData;
    
    const smartLink = this.createSmartLink('task_issue', { taskId: task._id });
    
    const variables = {
      problem,
      contact: contact || company.phone,
      link: smartLink.url
    };

    return await Notification.create({
      company: company._id,
      branch: branch._id,
      type: 'task_skipped',
      recipient: {
        type: 'client',
        client: client._id,
        contact: {
          phone: client.phone,
          email: client.email,
          whatsapp: client.whatsapp
        }
      },
      title: 'Task Issue',
      message: getMessage('task_skipped', variables),
      smartLink,
      relatedTo: {
        task: task._id
      },
      automation: {
        isAutomated: true,
        trigger: 'task_assigned'
      },
      priority: 'urgent'
    });
  }

  


  async scheduleFollowUp(notification, days) {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + days);

    
    
    await Notification.findByIdAndUpdate(notification._id, {
      'automation.nextFollowUp': followUpDate
    });

    return followUpDate;
  }

  


  async notifyAssignedStaff(booking, company, branch) {
    
    const staffNotifications = [];

    for (const assignment of booking.staffAssignment) {
      const smartLink = this.createSmartLink('booking_assignment', { bookingId: booking._id });
      
      const primaryFD = (Array.isArray(booking.functionDetailsList) && booking.functionDetailsList.length > 0)
        ? booking.functionDetailsList[0]
        : booking.functionDetails || {};

      const variables = {
        date: new Date(primaryFD.date).toLocaleDateString('hi-IN'),
        time: `${primaryFD.time?.start || ''} - ${primaryFD.time?.end || ''}`,
        location: primaryFD.venue?.address || booking.functionDetails?.venue?.address || '',
        client: booking.client?.name,
        link: smartLink.url
      };

      const notification = await Notification.create({
        company: company._id,
        branch: branch._id,
        type: 'task_assigned',
        recipient: {
          type: 'staff',
          staff: assignment.staff,
          contact: {
            phone: assignment.staff?.user?.phone,
            email: assignment.staff?.user?.email
          }
        },
        title: 'New Assignment',
        message: getMessage('task_assigned', variables),
        smartLink,
        relatedTo: {
          booking: booking._id
        },
        automation: {
          isAutomated: true,
          trigger: 'task_assigned'
        },
        priority: 'high'
      });

      staffNotifications.push(notification);
    }

    return staffNotifications;
  }
}

module.exports = new AutomatedMessagingService();
