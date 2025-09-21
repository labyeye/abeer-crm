const Task = require('../models/Task');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const Inventory = require('../models/Inventory');
const automatedMessaging = require('./automatedMessaging');

class TaskAutoAssignmentService {
  /**
   * Auto-assign tasks based on booking details
   */
  async autoAssignTasks(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('client')
        .populate('company')
        .populate('branch')
        .populate('staffAssignment.staff');

      if (!booking) {
        throw new Error('Booking not found');
      }

      const tasks = await this.createTasksFromBooking(booking);
      const assignmentResults = [];

      for (const task of tasks) {
        const assignedTask = await this.assignTaskToStaff(task, booking);
        assignmentResults.push(assignedTask);
      }

      // Send notifications to assigned staff and client
      await this.notifyTaskAssignments(assignmentResults, booking);

      return assignmentResults;
    } catch (error) {
      console.error('Error in auto-assigning tasks:', error);
      throw error;
    }
  }

  /**
   * Create tasks from booking details
   */
  async createTasksFromBooking(booking) {
    const tasks = [];

    // Equipment preparation task (once per booking)
    if (booking.equipmentAssignment && booking.equipmentAssignment.length > 0) {
      const preTaskDate = new Date();
      preTaskDate.setDate(preTaskDate.getDate() + 0); // default today if no function date available
      tasks.push({
        title: 'Equipment Preparation',
        description: 'Prepare and check all equipment for the function',
        type: 'equipment_prep',
        scheduledDate: preTaskDate,
        scheduledTime: { start: '10:00', end: '12:00' },
        priority: 'high',
        estimatedDuration: 120, // minutes
        requirements: {
          equipment: booking.equipmentAssignment,
          skills: ['equipment_handling']
        }
      });
    }

    // Build function details array (backward-compatible)
    const functionDetailsArray = Array.isArray(booking.functionDetailsList) && booking.functionDetailsList.length > 0
      ? booking.functionDetailsList
      : [booking.functionDetails];

    // Create per-function tasks
    for (const fd of functionDetailsArray) {
      if (!fd) continue;

      const functionDate = fd.date ? new Date(fd.date) : new Date();

      // Pre-function tasks: 1 day before
      const preTaskDate = new Date(functionDate);
      preTaskDate.setDate(preTaskDate.getDate() - 1);

      // Travel preparation task (if venue/address present)
      if (fd.venue && fd.venue.address) {
        const travelDate = new Date(functionDate);
        const startHour = fd.time?.start?.split(':')[0];
        travelDate.setHours(startHour ? parseInt(startHour) - 2 : functionDate.getHours() - 2);

        tasks.push({
          title: 'Travel to Venue',
          description: `Travel to ${fd.venue.name || 'venue'}`,
          type: 'travel',
          scheduledDate: functionDate,
          scheduledTime: {
            start: this.formatTime(travelDate),
            end: fd.time?.start
          },
          priority: 'high',
          estimatedDuration: 120,
          location: {
            address: fd.venue?.address,
            city: fd.venue?.city,
            coordinates: fd.venue?.coordinates
          },
          requirements: {
            transport: true,
            skills: ['photography', 'videography']
          }
        });
      }

      // Main function task
      tasks.push({
        title: `${fd.type} Photography/Videography`,
        description: `Main ${fd.type} coverage`,
        type: 'main_function',
        scheduledDate: functionDate,
        scheduledTime: fd.time,
        priority: 'urgent',
        estimatedDuration: this.calculateDuration(fd.time),
        location: {
          address: fd.venue?.address,
          city: fd.venue?.city,
          coordinates: fd.venue?.coordinates
        },
        requirements: {
          equipment: booking.equipmentAssignment,
          skills: ['photography', 'videography', 'drone_operation']
        }
      });

      // Post-function tasks: data backup 1 day after
      const postTaskDate = new Date(functionDate);
      postTaskDate.setDate(postTaskDate.getDate() + 1);
      tasks.push({
        title: 'Data Backup & Initial Processing',
        type: 'data_backup',
        scheduledDate: postTaskDate,
        scheduledTime: { start: '10:00', end: '14:00' },
        priority: 'high',
        estimatedDuration: 240,
        requirements: {
          skills: ['data_management', 'basic_editing']
        }
      });
    }

    // Create tasks in database
    const createdTasks = [];
    for (const taskData of tasks) {
      const task = await Task.create({
        ...taskData,
        company: booking.company && booking.company._id ? booking.company._id : booking.company,
        branch: booking.branch && booking.branch._id ? booking.branch._id : booking.branch,
        booking: booking._id,
        status: 'pending',
        assignedTo: [],
        createdBy: booking.createdBy || (booking.branch && booking.branch.admin)
      });
      createdTasks.push(task);
    }

    return createdTasks;
  }

  /**
   * Assign task to appropriate staff based on skills and availability
   */
  async assignTaskToStaff(task, booking) {
    try {
      // Get available staff for the task date and time
      const availableStaff = await this.getAvailableStaff(
        task.scheduledDate,
        task.scheduledTime,
        booking.branch._id
      );

      const assignedStaff = [];

      // Assign based on task type
      switch (task.type) {
        case 'equipment_prep': {
          // Assign 1-2 staff members with equipment handling skills
          const equipmentStaff = availableStaff
            .filter(s => s.skills?.includes('equipment_handling'))
            .slice(0, 2);
          assignedStaff.push(...equipmentStaff);
          break;
        }

        case 'main_function': {
          const photographer = availableStaff.find(s => s.skills?.includes('photography') || (s.designation || '').toLowerCase().includes('photographer'));
          const videographer = availableStaff.find(s => s.skills?.includes('videography') || (s.designation || '').toLowerCase().includes('videographer'));
          const assistant = availableStaff.find(s => (s.designation || '').toLowerCase().includes('assistant'));

          if (photographer) assignedStaff.push(photographer);
          if (videographer) assignedStaff.push(videographer);
          if (assistant) assignedStaff.push(assistant);

          // If not enough specific staff, assign from available pool until we have 2
          while (assignedStaff.length < 2 && availableStaff.length > assignedStaff.length) {
            const nextStaff = availableStaff.find(s => !assignedStaff.includes(s));
            if (!nextStaff) break;
            assignedStaff.push(nextStaff);
          }
          break;
        }

        case 'data_backup': {
          // Assign staff with data management skills
          const dataStaff = availableStaff
            .filter(s => s.skills?.includes('data_management') || s.skills?.includes('basic_editing'))
            .slice(0, 1);
          assignedStaff.push(...dataStaff);
          break;
        }

        default: {
          // Default assignment - first available staff
          if (availableStaff.length > 0) {
            assignedStaff.push(availableStaff[0]);
          }
        }
      }

      // Update task with assigned staff
      const assignmentData = assignedStaff.map(staff => ({
        staff: staff._id,
        role: this.determineStaffRole(staff, task.type),
        assignedDate: new Date()
      }));

      const updatedTask = await Task.findByIdAndUpdate(
        task._id,
        {
          assignedTo: assignmentData,
          status: assignedStaff.length > 0 ? 'assigned' : 'pending'
        },
        { new: true }
      ).populate('assignedTo.staff');

      return {
        task: updatedTask,
        assignedStaff,
        booking
      };
    } catch (error) {
      console.error('Error assigning task to staff:', error);
      throw error;
    }
  }

  /**
   * Get available staff for specific date and time
   */
  async getAvailableStaff(date, time, branchId, requiredSkills = []) {
    try {
      // Get all active staff in the branch
      const allStaff = await Staff.find({
        branch: branchId,
        status: 'active',
        isDeleted: false
      }).populate('user');

      // Check availability (this is a simplified version)
      // In a real implementation, you'd check against existing tasks, attendance, etc.
      const availableStaff = [];

      for (const staff of allStaff) {
        // Check if staff is already assigned to other tasks at the same time
        const conflictingTasks = await Task.find({
          'assignedTo.staff': staff._id,
          scheduledDate: date,
          status: { $nin: ['completed', 'cancelled'] },
          isDeleted: false
        });

        const hasConflict = conflictingTasks.some(task => {
          return this.isTimeConflict(task.scheduledTime, time);
        });

        if (!hasConflict) {
          // Add skill matching score
          const skillMatch = this.calculateSkillMatch(staff.skills || [], requiredSkills);
          staff.skillMatchScore = skillMatch;
          availableStaff.push(staff);
        }
      }

      // Sort by skill match score (descending)
      return availableStaff.sort((a, b) => (b.skillMatchScore || 0) - (a.skillMatchScore || 0));
    } catch (error) {
      console.error('Error getting available staff:', error);
      return [];
    }
  }

  /**
   * Send notifications for task assignments
   */
  async notifyTaskAssignments(assignmentResults, booking) {
    try {
      for (const result of assignmentResults) {
        if (result.assignedStaff && result.assignedStaff.length > 0) {
          // Notify assigned staff
          await automatedMessaging.sendTaskAssigned({
            staff: result.assignedStaff,
            task: result.task,
            booking: booking,
            company: booking.company,
            branch: booking.branch
          });
        }
      }

      // Notify client about staff assignment
      const allAssignedStaff = assignmentResults
        .flatMap(r => r.assignedStaff)
        .filter((staff, index, self) => 
          index === self.findIndex(s => s._id.toString() === staff._id.toString())
        );

      if (allAssignedStaff.length > 0) {
        const equipmentList = booking.equipmentAssignment?.map(eq => ({ name: eq.equipment?.name || 'Equipment' })) || [];
        
        await automatedMessaging.sendStaffAssignment({
          client: booking.client,
          booking: booking,
          staffList: allAssignedStaff,
          equipmentList: equipmentList,
          company: booking.company,
          branch: booking.branch
        });
      }
    } catch (error) {
      console.error('Error sending task assignment notifications:', error);
    }
  }

  /**
   * Calculate skill match score
   */
  calculateSkillMatch(staffSkills, requiredSkills) {
    if (requiredSkills.length === 0) return 1;
    
    const matches = requiredSkills.filter(skill => staffSkills.includes(skill)).length;
    return matches / requiredSkills.length;
  }

  /**
   * Check if two time ranges conflict
   */
  isTimeConflict(time1, time2) {
    if (!time1 || !time2) return false;
    
    const start1 = this.timeToMinutes(time1.start);
    const end1 = this.timeToMinutes(time1.end);
    const start2 = this.timeToMinutes(time2.start);
    const end2 = this.timeToMinutes(time2.end);
    
    return (start1 < end2 && start2 < end1);
  }

  /**
   * Convert time string to minutes
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate duration between start and end time
   */
  calculateDuration(time) {
    if (!time || !time.start || !time.end) return 240; // default 4 hours
    
    const start = this.timeToMinutes(time.start);
    const end = this.timeToMinutes(time.end);
    return Math.max(end - start, 60); // minimum 1 hour
  }

  /**
   * Format time from Date object
   */
  formatTime(date) {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Determine staff role based on designation and task type
   */
  determineStaffRole(staff, taskType) {
    const designation = staff.designation.toLowerCase();
    
    if (designation.includes('photographer')) return 'photographer';
    if (designation.includes('videographer')) return 'videographer';
    if (designation.includes('assistant')) return 'assistant';
    if (designation.includes('drone')) return 'drone_operator';
    if (designation.includes('editor')) return 'editor';
    
    // Default roles based on task type
    switch (taskType) {
      case 'equipment_prep': return 'equipment_handler';
      case 'travel': return 'crew_member';
      case 'main_function': return 'crew_member';
      case 'data_backup': return 'data_manager';
      default: return 'staff';
    }
  }

  /**
   * Skip a task with reason and notify client
   */
  async skipTask(taskId, reason, skippedBy) {
    try {
      const task = await Task.findById(taskId)
        .populate('booking')
        .populate({
          path: 'booking',
          populate: [
            { path: 'client' },
            { path: 'company' },
            { path: 'branch' }
          ]
        });

      if (!task) {
        throw new Error('Task not found');
      }

      // Update task status
      await Task.findByIdAndUpdate(taskId, {
        status: 'skipped',
        skipReason: reason,
        skippedBy: skippedBy,
        skippedAt: new Date()
      });

      // Notify client about the issue
      await automatedMessaging.sendTaskSkipped({
        client: task.booking.client,
        task: task,
        problem: reason,
        company: task.booking.company,
        branch: task.booking.branch,
        contact: task.booking.company.phone
      });

      return { success: true, message: 'Task skipped and client notified' };
    } catch (error) {
      console.error('Error skipping task:', error);
      throw error;
    }
  }
}

module.exports = new TaskAutoAssignmentService();
