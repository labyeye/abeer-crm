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
    const functionDate = new Date(booking.functionDetails.date);

    // Pre-function tasks
    const preTaskDate = new Date(functionDate);
    preTaskDate.setDate(preTaskDate.getDate() - 1); // 1 day before

    // Equipment preparation task
    if (booking.equipmentAssignment && booking.equipmentAssignment.length > 0) {
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

    // Travel preparation task (if outdoor)
    if (booking.functionDetails.venue && booking.functionDetails.venue.address) {
      const travelDate = new Date(functionDate);
      travelDate.setHours(parseInt(booking.functionDetails.time?.start?.split(':')[0]) - 2); // 2 hours before function

      tasks.push({
        title: 'Travel to Venue',
        description: `Travel to ${booking.functionDetails.venue.name || 'venue'}`,
        type: 'travel',
        scheduledDate: functionDate,
        scheduledTime: { 
          start: this.formatTime(travelDate), 
          end: booking.functionDetails.time?.start 
        },
        priority: 'high',
        estimatedDuration: 120,
        location: {
          address: booking.functionDetails.venue.address,
          city: booking.functionDetails.venue.city,
          coordinates: booking.functionDetails.venue.coordinates
        },
        requirements: {
          transport: true,
          skills: ['photography', 'videography']
        }
      });
    }

    // Main function task
    tasks.push({
      title: `${booking.functionDetails.type} Photography/Videography`,
      description: `Main ${booking.functionDetails.type} coverage`,
      type: 'main_function',
      scheduledDate: functionDate,
      scheduledTime: booking.functionDetails.time,
      priority: 'urgent',
      estimatedDuration: this.calculateDuration(booking.functionDetails.time),
      location: {
        address: booking.functionDetails.venue?.address,
        city: booking.functionDetails.venue?.city,
        coordinates: booking.functionDetails.venue?.coordinates
      },
      requirements: {
        equipment: booking.equipmentAssignment,
        skills: ['photography', 'videography', 'drone_operation']
      }
    });

    // Post-function tasks
    const postTaskDate = new Date(functionDate);
    postTaskDate.setDate(postTaskDate.getDate() + 1); // 1 day after

    // Data backup task
    tasks.push({
      title: 'Data Backup & Initial Processing',
      description: 'Backup all captured data and start initial processing',
      type: 'data_backup',
      scheduledDate: postTaskDate,
      scheduledTime: { start: '10:00', end: '14:00' },
      priority: 'high',
      estimatedDuration: 240,
      requirements: {
        skills: ['data_management', 'basic_editing']
      }
    });

    // Create tasks in database
    const createdTasks = [];
    for (const taskData of tasks) {
      const task = await Task.create({
        ...taskData,
        company: booking.company._id,
        branch: booking.branch._id,
        booking: booking._id,
        status: 'pending',
        assignedTo: [],
        createdBy: booking.createdBy || booking.branch.admin
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
        booking.branch._id,
        task.requirements?.skills || []
      );

      const assignedStaff = [];

      // Assign based on task type
      switch (task.type) {
        case 'equipment_prep':
          // Assign 1-2 staff members with equipment handling skills
          const equipmentStaff = availableStaff
            .filter(s => s.skills?.includes('equipment_handling'))
            .slice(0, 2);
          assignedStaff.push(...equipmentStaff);
          break;

        case 'travel':
        case 'main_function':
          // Assign photographer, videographer, and assistant
          const photographer = availableStaff.find(s => 
            s.designation.toLowerCase().includes('photographer') && 
            s.skills?.includes('photography')
          );
          const videographer = availableStaff.find(s => 
            s.designation.toLowerCase().includes('videographer') && 
            s.skills?.includes('videography')
          );
          const assistant = availableStaff.find(s => 
            s.designation.toLowerCase().includes('assistant')
          );

          if (photographer) assignedStaff.push(photographer);
          if (videographer) assignedStaff.push(videographer);
          if (assistant) assignedStaff.push(assistant);

          // If not enough specific staff, assign from available pool
          while (assignedStaff.length < 2 && availableStaff.length > assignedStaff.length) {
            const nextStaff = availableStaff.find(s => !assignedStaff.includes(s));
            if (nextStaff) assignedStaff.push(nextStaff);
          }
          break;

        case 'data_backup':
          // Assign staff with data management skills
          const dataStaff = availableStaff
            .filter(s => s.skills?.includes('data_management') || s.skills?.includes('basic_editing'))
            .slice(0, 1);
          assignedStaff.push(...dataStaff);
          break;

        default:
          // Default assignment - first available staff
          if (availableStaff.length > 0) {
            assignedStaff.push(availableStaff[0]);
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
