import { useState, useEffect } from 'react';
import { 
  Camera, 
  Edit3, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Share2,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProductionProject {
  _id: string;
  projectName: string;
  booking: {
    bookingNumber: string;
    client: { name: string; phone: string };
    functionDetails: { type: string; date: string };
  };
  stages: ProductionStage[];
  currentStage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'planning' | 'shooting' | 'editing' | 'review' | 'delivery' | 'completed' | 'archived';
  assignedTeam: Array<{
    staff: { _id: string; user: { name: string }; designation: string };
    role: string;
    stage: string;
  }>;
  deliverables: Array<{
    type: 'photos' | 'videos' | 'album' | 'digital_copy';
    format: string;
    quantity: number;
    status: 'pending' | 'in_progress' | 'completed' | 'delivered';
  }>;
  timeline: {
    estimatedDelivery: string;
    actualDelivery?: string;
    milestones: Array<{
      stage: string;
      plannedDate: string;
      completedDate?: string;
      status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    }>;
  };
  resources: {
    equipment: Array<{ item: string; quantity: number; status: 'allocated' | 'in_use' | 'returned' }>;
    storage: { used: number; total: number; unit: 'GB' | 'TB' };
  };
  qualityMetrics: {
    clientRating?: number;
    revisionsCount: number;
    deliveryScore: number; 
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductionStage {
  _id: string;
  name: string;
  description: string;
  estimatedDuration: number; 
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped';
  startDate?: string;
  endDate?: string;
  dependencies: string[]; 
  deliverables: string[];
  assignedStaff: string[];
  notes: string;
  progress: number; 
}

const ProductionWorkflow = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProductionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProductionProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    stage: '',
    assignedTo: '',
    dateRange: ''
  });
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline' | 'list'>('kanban');
  const [productionStats, setProductionStats] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
    fetchProductionStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const mockProjects: ProductionProject[] = [
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
            },
            {
              _id: 's2',
              name: 'Event Shooting',
              description: 'Main photography and videography during the wedding',
              estimatedDuration: 12,
              status: 'completed',
              startDate: '2024-12-15',
              endDate: '2024-12-15',
              dependencies: ['s1'],
              deliverables: ['Raw Photos', 'Raw Videos'],
              assignedStaff: ['staff1', 'staff2'],
              notes: 'Captured 2000+ photos and 4 hours of video',
              progress: 100
            },
            {
              _id: 's3',
              name: 'Post-Production Editing',
              description: 'Photo editing, video editing, color correction',
              estimatedDuration: 40,
              status: 'in_progress',
              startDate: '2024-12-16',
              dependencies: ['s2'],
              deliverables: ['Edited Photos', 'Wedding Video', 'Highlight Reel'],
              assignedStaff: ['staff3', 'staff4'],
              notes: 'Photo editing 80% complete, video editing in progress',
              progress: 65
            },
            {
              _id: 's4',
              name: 'Client Review',
              description: 'Client feedback and revisions',
              estimatedDuration: 8,
              status: 'pending',
              dependencies: ['s3'],
              deliverables: ['Client Approval'],
              assignedStaff: ['staff1'],
              notes: '',
              progress: 0
            },
            {
              _id: 's5',
              name: 'Final Delivery',
              description: 'Album creation, digital delivery, physical copies',
              estimatedDuration: 16,
              status: 'pending',
              dependencies: ['s4'],
              deliverables: ['Wedding Album', 'Digital Gallery', 'USB Drive'],
              assignedStaff: ['staff1', 'staff5'],
              notes: '',
              progress: 0
            }
          ],
          currentStage: 'editing',
          priority: 'high',
          status: 'editing',
          assignedTeam: [
            { staff: { _id: 'staff1', user: { name: 'John Doe' }, designation: 'Lead Photographer' }, role: 'Project Lead', stage: 'all' },
            { staff: { _id: 'staff3', user: { name: 'Alice Smith' }, designation: 'Photo Editor' }, role: 'Photo Editor', stage: 'editing' }
          ],
          deliverables: [
            { type: 'photos', format: 'JPEG', quantity: 500, status: 'in_progress' },
            { type: 'videos', format: 'MP4', quantity: 1, status: 'pending' },
            { type: 'album', format: 'Physical', quantity: 1, status: 'pending' }
          ],
          timeline: {
            estimatedDelivery: '2024-12-30',
            milestones: [
              { stage: 'Pre-Production Planning', plannedDate: '2024-12-02', completedDate: '2024-12-02', status: 'completed' },
              { stage: 'Event Shooting', plannedDate: '2024-12-15', completedDate: '2024-12-15', status: 'completed' },
              { stage: 'Post-Production Editing', plannedDate: '2024-12-25', status: 'in_progress' },
              { stage: 'Client Review', plannedDate: '2024-12-28', status: 'pending' },
              { stage: 'Final Delivery', plannedDate: '2024-12-30', status: 'pending' }
            ]
          },
          resources: {
            equipment: [
              { item: 'Canon EOS R5', quantity: 2, status: 'returned' },
              { item: 'Sony FX3', quantity: 1, status: 'returned' },
              { item: 'Lighting Kit', quantity: 1, status: 'returned' }
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
      setProjects(mockProjects);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch production projects'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionStats = async () => {
    try {
      
      const mockStats = {
        totalProjects: 15,
        activeProjects: 8,
        completedThisMonth: 4,
        delayedProjects: 2,
        averageDeliveryTime: 12, 
        clientSatisfactionScore: 4.6,
        resourceUtilization: 78,
        upcomingDeadlines: 3
      };
      setProductionStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch production stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(project => project.priority === filters.priority);
    }
    if (filters.stage) {
      filtered = filtered.filter(project => project.currentStage === filters.stage);
    }

    setFilteredProjects(filtered);
  };

  const handleStageUpdate = async (projectId: string, stageId: string, updates: Partial<ProductionStage>) => {
    try {
      
      console.log('Updating stage:', { projectId, stageId, updates });
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Stage updated successfully'
      });
      await fetchProjects();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update stage'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStageIcon = (stageName: string) => {
    if (stageName.includes('Planning')) return <FileText className="w-4 h-4" />;
    if (stageName.includes('Shooting')) return <Camera className="w-4 h-4" />;
    if (stageName.includes('Editing')) return <Edit3 className="w-4 h-4" />;
    if (stageName.includes('Review')) return <Eye className="w-4 h-4" />;
    if (stageName.includes('Delivery')) return <Share2 className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Workflow</h1>
          <p className="text-gray-600 mt-1">Manage photography and videography production pipeline</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {}
      {productionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <NeomorphicCard className="p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">{productionStats.activeProjects}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold text-green-600">{productionStats.completedThisMonth}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delayed Projects</p>
                <p className="text-2xl font-bold text-red-600">{productionStats.delayedProjects}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Delivery (Days)</p>
                <p className="text-2xl font-bold text-gray-900">{productionStats.averageDeliveryTime}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </NeomorphicCard>
        </div>
      )}

      {}
      <NeomorphicCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="shooting">Shooting</option>
              <option value="editing">Editing</option>
              <option value="review">Review</option>
              <option value="delivery">Delivery</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Stage</label>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              <option value="planning">Planning</option>
              <option value="shooting">Shooting</option>
              <option value="editing">Editing</option>
              <option value="review">Review</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <NeomorphicButton
              onClick={() => setFilters({
                status: '',
                priority: '',
                stage: '',
                assignedTo: '',
                dateRange: ''
              })}
              className="w-full"
            >
              Clear Filters
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicCard>

      {}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div key={project._id} 
              className="cursor-pointer"
              onClick={() => {
                setSelectedProject(project);
                setShowProjectModal(true);
              }}
            >
              <NeomorphicCard className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                      <p className="text-sm text-gray-600">{project.booking.bookingNumber}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {project.booking.client.name}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(project.booking.functionDetails.date).toLocaleDateString()}
                    </div>
                  </div>

                  {}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Current Stage</span>
                      <span className="text-gray-900 font-medium">{project.currentStage}</span>
                    </div>
                    {project.stages.find(s => s.name.toLowerCase().includes(project.currentStage)) && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${project.stages.find(s => s.name.toLowerCase().includes(project.currentStage))?.progress || 0}%` 
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(project.timeline.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>

                  {}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Team:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.assignedTeam.slice(0, 3).map((member, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {member.staff.user.name}
                        </span>
                      ))}
                      {project.assignedTeam.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{project.assignedTeam.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </NeomorphicCard>
            </div>
          ))}
        </div>
      )}

      {}
      <NeomorphicModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title={selectedProject?.projectName || 'Project Details'}
      >
        {selectedProject && (
          <div className="space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Project Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking Number:</span>
                    <span className="text-gray-900">{selectedProject.booking.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="text-gray-900">{selectedProject.booking.client.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type:</span>
                    <span className="text-gray-900">{selectedProject.booking.functionDetails.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Date:</span>
                    <span className="text-gray-900">
                      {new Date(selectedProject.booking.functionDetails.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Progress & Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Stage:</span>
                    <span className="text-gray-900">{selectedProject.currentStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery:</span>
                    <span className="text-gray-900">
                      {new Date(selectedProject.timeline.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Score:</span>
                    <span className="text-gray-900">{selectedProject.qualityMetrics.deliveryScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revisions:</span>
                    <span className="text-gray-900">{selectedProject.qualityMetrics.revisionsCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Production Stages</h4>
              <div className="space-y-3">
                {selectedProject.stages.map((stage) => (
                  <div key={stage._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStageIcon(stage.name)}
                        <h5 className="font-medium text-gray-900">{stage.name}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stage.status)}`}>
                          {stage.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{stage.progress}%</span>
                        {stage.status === 'in_progress' && (
                          <NeomorphicButton
                            onClick={() => {
                              setSelectedStage(stage);
                              setShowStageModal(true);
                            }}
                            className="text-xs px-2 py-1"
                          >
                            Update
                          </NeomorphicButton>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{stage.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Duration:</span> {stage.estimatedDuration}h
                      </div>
                      <div>
                        <span className="font-medium">Deliverables:</span> {stage.deliverables.join(', ')}
                      </div>
                    </div>
                    
                    {stage.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stage.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {stage.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {stage.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Resource Usage</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Equipment</h5>
                  <div className="space-y-1">
                    {selectedProject.resources.equipment.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.item}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'returned' ? 'text-green-600 bg-green-100' :
                          item.status === 'in_use' ? 'text-blue-600 bg-blue-100' :
                          'text-yellow-600 bg-yellow-100'
                        }`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Storage Usage</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Used Storage:</span>
                      <span className="text-gray-900">
                        {selectedProject.resources.storage.used} / {selectedProject.resources.storage.total} {selectedProject.resources.storage.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(selectedProject.resources.storage.used / selectedProject.resources.storage.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </NeomorphicModal>

      {}
      <NeomorphicModal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        title={`Update: ${selectedStage?.name}`}
      >
        {selectedStage && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedStage.progress}
                onChange={(e) => setSelectedStage({
                  ...selectedStage,
                  progress: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {selectedStage.progress}%
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStage.status}
                onChange={(e) => setSelectedStage({
                  ...selectedStage,
                  status: e.target.value as any
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={selectedStage.notes}
                onChange={(e) => setSelectedStage({
                  ...selectedStage,
                  notes: e.target.value
                })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this stage..."
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <NeomorphicButton
                onClick={() => setShowStageModal(false)}
                className="px-4 py-2 border border-gray-300"
              >
                Cancel
              </NeomorphicButton>
              <NeomorphicButton
                onClick={() => {
                  if (selectedProject && selectedStage) {
                    handleStageUpdate(selectedProject._id, selectedStage._id, selectedStage);
                    setShowStageModal(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
              >
                Update Stage
              </NeomorphicButton>
            </div>
          </div>
        )}
      </NeomorphicModal>
    </div>
  );
};

export default ProductionWorkflow;
