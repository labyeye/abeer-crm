const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');




router.get('/', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    
    const projects = [
      {
        _id: '1',
        projectName: 'Wedding - Sharma Family',
        booking: {
          bookingNumber: 'BK-2024-001',
          client: { name: 'Rajesh Sharma', phone: '+91-9876543210' },
          functionDetails: { type: 'Wedding', date: '2024-12-15' }
        },
        stages: [
          {
            _id: 's1',
            name: 'Pre-Production Planning',
            description: 'Equipment check, shot list preparation, timeline finalization',
            estimatedDuration: 8,
            status: 'completed',
            startDate: '2024-12-01',
            endDate: '2024-12-02',
            dependencies: [],
            deliverables: ['Shot List', 'Equipment Checklist', 'Timeline'],
            assignedStaff: ['staff1'],
            notes: 'All preparations completed on schedule',
            progress: 100
          }
        ],
        currentStage: 'editing',
        priority: 'high',
        status: 'editing',
        assignedTeam: [
          { staff: { _id: 'staff1', user: { name: 'John Doe' }, designation: 'Lead Photographer' }, role: 'Project Lead', stage: 'all' }
        ],
        deliverables: [
          { type: 'photos', format: 'JPEG', quantity: 500, status: 'in_progress' }
        ],
        timeline: {
          estimatedDelivery: '2024-12-30',
          milestones: []
        },
        resources: {
          equipment: [
            { item: 'Canon EOS R5', quantity: 2, status: 'returned' }
          ],
          storage: { used: 250, total: 500, unit: 'GB' }
        },
        qualityMetrics: {
          revisionsCount: 1,
          deliveryScore: 85
        },
        createdAt: '2024-12-01',
        updatedAt: '2024-12-18'
      }
    ];

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});




router.get('/stats', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    const stats = {
      totalProjects: 15,
      activeProjects: 8,
      completedThisMonth: 4,
      delayedProjects: 2,
      averageDeliveryTime: 12,
      clientSatisfactionScore: 4.6,
      resourceUtilization: 78,
      upcomingDeadlines: 3
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});




router.put('/:projectId/stages/:stageId', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    const { projectId, stageId } = req.params;
    const updates = req.body;

    
    res.status(200).json({
      success: true,
      message: 'Stage updated successfully',
      data: { projectId, stageId, updates }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});




router.post('/', protect, authorize(['chairman', 'company_admin', 'branch_head']), async (req, res) => {
  try {
    const projectData = req.body;

    
    const newProject = {
      _id: Date.now().toString(),
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
