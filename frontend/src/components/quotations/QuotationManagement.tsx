import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Download,
  Send,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Camera,
  Copy
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const QuotationManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('quotations');
  const { addNotification } = useNotification();

  const quotations = [
    {
      id: 'QUO-2024-001',
      clientName: 'Sarah & Michael Johnson',
      clientEmail: 'sarah.johnson@email.com',
      clientPhone: '+1 (555) 0123',
      eventType: 'Wedding Photography',
      eventDate: '2024-02-14',
      eventLocation: 'Central Park, New York',
      quotationDate: '2024-01-15',
      validUntil: '2024-02-01',
      status: 'sent',
      totalAmount: 2500,
      services: [
        { name: 'Wedding Photography (8 hours)', price: 1800, quantity: 1 },
        { name: 'Photo Editing & Album', price: 500, quantity: 1 },
        { name: 'Additional Photographer', price: 200, quantity: 1 }
      ],
      gstIncluded: true,
      gstAmount: 450,
      notes: 'Premium wedding package with same-day highlights',
      followUpDate: '2024-01-22',
      photographer: 'Alex Rodriguez',
      template: 'Wedding Premium'
    },
    {
      id: 'QUO-2024-002',
      clientName: 'Tech Innovations Inc.',
      clientEmail: 'contact@techinnovations.com',
      clientPhone: '+1 (555) 0124',
      eventType: 'Corporate Headshots',
      eventDate: '2024-01-30',
      eventLocation: 'Downtown Office',
      quotationDate: '2024-01-16',
      validUntil: '2024-01-25',
      status: 'approved',
      totalAmount: 800,
      services: [
        { name: 'Corporate Headshots (20 employees)', price: 600, quantity: 1 },
        { name: 'Basic Retouching', price: 150, quantity: 1 },
        { name: 'Digital Delivery', price: 50, quantity: 1 }
      ],
      gstIncluded: true,
      gstAmount: 144,
      notes: 'Professional headshots for company website',
      followUpDate: null,
      photographer: 'Sarah Chen',
      template: 'Corporate Standard'
    },
    {
      id: 'QUO-2024-003',
      clientName: 'Emma Wilson',
      clientEmail: 'emma.wilson@email.com',
      clientPhone: '+1 (555) 0125',
      eventType: 'Family Portrait',
      eventDate: '2024-02-05',
      eventLocation: 'Sunset Beach',
      quotationDate: '2024-01-18',
      validUntil: '2024-01-28',
      status: 'pending',
      totalAmount: 450,
      services: [
        { name: 'Family Portrait Session (2 hours)', price: 300, quantity: 1 },
        { name: 'Photo Editing (10 photos)', price: 100, quantity: 1 },
        { name: 'Print Package', price: 50, quantity: 1 }
      ],
      gstIncluded: false,
      gstAmount: 0,
      notes: 'Outdoor family session at golden hour',
      followUpDate: '2024-01-25',
      photographer: 'Mike Johnson',
      template: 'Family Basic'
    },
    {
      id: 'QUO-2024-004',
      clientName: 'Fashion Brand LLC',
      clientEmail: 'hello@fashionbrand.com',
      clientPhone: '+1 (555) 0126',
      eventType: 'Product Photography',
      eventDate: '2024-02-10',
      eventLocation: 'Studio A',
      quotationDate: '2024-01-20',
      validUntil: '2024-02-05',
      status: 'rejected',
      totalAmount: 1200,
      services: [
        { name: 'Product Photography (50 items)', price: 800, quantity: 1 },
        { name: 'Advanced Retouching', price: 300, quantity: 1 },
        { name: 'Rush Delivery', price: 100, quantity: 1 }
      ],
      gstIncluded: true,
      gstAmount: 216,
      notes: 'High-end product photography for e-commerce',
      followUpDate: null,
      photographer: 'David Kim',
      template: 'Commercial Premium'
    },
    {
      id: 'QUO-2024-005',
      clientName: 'Global Marketing Agency',
      clientEmail: 'projects@globalmarketing.com',
      clientPhone: '+1 (555) 0127',
      eventType: 'Event Coverage',
      eventDate: '2024-02-20',
      eventLocation: 'Convention Center',
      quotationDate: '2024-01-22',
      validUntil: '2024-02-10',
      status: 'expired',
      totalAmount: 3200,
      services: [
        { name: 'Event Photography (Full Day)', price: 2000, quantity: 1 },
        { name: 'Videography', price: 800, quantity: 1 },
        { name: 'Same Day Editing', price: 400, quantity: 1 }
      ],
      gstIncluded: true,
      gstAmount: 576,
      notes: 'Complete event coverage with live streaming',
      followUpDate: '2024-02-01',
      photographer: 'Alex Rodriguez',
      template: 'Event Premium'
    }
  ];

  const templates = [
    {
      id: 1,
      name: 'Wedding Premium',
      category: 'Wedding',
      description: 'Comprehensive wedding photography package',
      services: ['Photography', 'Videography', 'Album', 'Editing'],
      basePrice: 2500,
      gstIncluded: true,
      lastUsed: '2024-01-15'
    },
    {
      id: 2,
      name: 'Corporate Standard',
      category: 'Corporate',
      description: 'Professional corporate photography services',
      services: ['Headshots', 'Event Coverage', 'Basic Editing'],
      basePrice: 800,
      gstIncluded: true,
      lastUsed: '2024-01-16'
    },
    {
      id: 3,
      name: 'Family Basic',
      category: 'Portrait',
      description: 'Family portrait session package',
      services: ['Portrait Session', 'Basic Editing', 'Digital Delivery'],
      basePrice: 450,
      gstIncluded: false,
      lastUsed: '2024-01-18'
    },
    {
      id: 4,
      name: 'Commercial Premium',
      category: 'Commercial',
      description: 'High-end commercial photography',
      services: ['Product Photography', 'Advanced Editing', 'Rush Service'],
      basePrice: 1200,
      gstIncluded: true,
      lastUsed: '2024-01-20'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return Edit;
      case 'sent': return Send;
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'expired': return AlertTriangle;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-700';
      case 'sent': return 'bg-blue-50 text-blue-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'approved': return 'bg-emerald-50 text-emerald-700';
      case 'rejected': return 'bg-red-50 text-red-700';
      case 'expired': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const handleCreateQuotation = () => {
    addNotification({
      type: 'info',
      title: 'Create Quotation',
      message: 'Quotation creation form opened'
    });
  };

  const handleQuotationAction = (action: string, quotationId: string) => {
    addNotification({
      type: 'info',
      title: `Quotation ${action}`,
      message: `${action} for ${quotationId} initiated`
    });
  };

  const handleTemplateAction = (action: string, templateName: string) => {
    addNotification({
      type: 'info',
      title: `Template ${action}`,
      message: `${action} for ${templateName} template`
    });
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quotation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const quotationStats = {
    total: quotations.length,
    sent: quotations.filter(q => q.status === 'sent').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    pending: quotations.filter(q => q.status === 'pending').length,
    totalValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    approvalRate: Math.round((quotations.filter(q => q.status === 'approved').length / quotations.length) * 100)
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and track quotations and proposals</p>
        </div>
        <button
          onClick={handleCreateQuotation}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quotation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{quotationStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Sent</p>
              <p className="text-xl font-bold text-gray-900">{quotationStats.sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Approved</p>
              <p className="text-xl font-bold text-gray-900">{quotationStats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{quotationStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-purple-500 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Total Value</p>
              <p className="text-xl font-bold text-gray-900">${quotationStats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Approval Rate</p>
              <p className="text-xl font-bold text-gray-900">{quotationStats.approvalRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'quotations', name: 'Quotations', icon: FileText },
              { id: 'templates', name: 'Templates', icon: Copy }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'quotations' && (
            <div className="space-y-4">
              {filteredQuotations.map((quotation) => {
                const StatusIcon = getStatusIcon(quotation.status);
                
                return (
                  <div key={quotation.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{quotation.id}</h3>
                          <p className="text-sm text-gray-600">{quotation.eventType}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {quotation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Client Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            {quotation.clientName}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {quotation.clientEmail}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {quotation.clientPhone}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Event Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {quotation.eventDate}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {quotation.eventLocation}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Camera className="w-4 h-4 mr-2" />
                            {quotation.photographer}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Financial Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">${quotation.totalAmount - quotation.gstAmount}</span>
                          </div>
                          {quotation.gstIncluded && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">GST:</span>
                              <span className="font-medium text-gray-900">${quotation.gstAmount}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-900">${quotation.totalAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valid Until:</span>
                            <span className="font-medium text-gray-900">{quotation.validUntil}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Services Included:</h5>
                      <div className="space-y-1">
                        {quotation.services.map((service, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{service.name} (x{service.quantity})</span>
                            <span className="font-medium text-gray-900">${service.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {quotation.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{quotation.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Created: {quotation.quotationDate}
                        {quotation.followUpDate && (
                          <span className="ml-4">Follow-up: {quotation.followUpDate}</span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleQuotationAction('View', quotation.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Quotation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleQuotationAction('Edit', quotation.id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Quotation"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleQuotationAction('Download', quotation.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleQuotationAction('Send', quotation.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Send to Client"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.category}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {template.category}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Included Services:</h5>
                      <div className="flex flex-wrap gap-1">
                        {template.services.map((service, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600">Base Price:</span>
                        <span className="font-bold text-gray-900 ml-2">${template.basePrice}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.gstIncluded ? 'GST Included' : 'GST Extra'}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Last used: {template.lastUsed}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleTemplateAction('Use', template.name)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Use Template
                      </button>
                      <button 
                        onClick={() => handleTemplateAction('Edit', template.name)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <button 
                      onClick={() => handleTemplateAction('Duplicate', template.name)}
                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagement;