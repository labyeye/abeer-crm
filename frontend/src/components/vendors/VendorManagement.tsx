import { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NeomorphicCard from '../ui/NeomorphicCard';
import NeomorphicButton from '../ui/NeomorphicButton';
import NeomorphicModal from '../ui/NeomorphicModal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Vendor {
  _id: string;
  companyName: string;
  contactPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  businessInfo: {
    gstNumber?: string;
    panNumber?: string;
    businessType: 'equipment_rental' | 'printing' | 'transportation' | 'catering' | 'decoration' | 'other';
    establishedYear: number;
    website?: string;
  };
  services: Array<{
    category: string;
    description: string;
    priceRange: { min: number; max: number; unit: string };
    availability: 'always' | 'on_demand' | 'seasonal';
  }>;
  ratings: {
    overall: number;
    reliability: number;
    quality: number;
    pricing: number;
    communication: number;
    totalReviews: number;
  };
  financials: {
    totalTransactions: number;
    totalValue: number;
    outstandingAmount: number;
    creditLimit: number;
    paymentTerms: string;
    lastPayment?: string;
  };
  contractInfo: {
    contractType: 'per_project' | 'annual' | 'monthly';
    startDate?: string;
    endDate?: string;
    autoRenewal: boolean;
    terms: string[];
  };
  performance: {
    onTimeDelivery: number; // percentage
    qualityScore: number; // percentage
    responsiveness: number; // hours average
    issueResolutionTime: number; // hours average
  };
  status: 'active' | 'inactive' | 'blacklisted' | 'pending_verification';
  documents: Array<{
    type: 'contract' | 'gst_certificate' | 'pan_card' | 'bank_details' | 'other';
    fileName: string;
    uploadedDate: string;
    verified: boolean;
  }>;
  recentOrders: Array<{
    orderId: string;
    date: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface VendorStats {
  totalVendors: number;
  activeVendors: number;
  pendingVerification: number;
  blacklistedVendors: number;
  totalSpend: number;
  avgRating: number;
  topCategories: Array<{ category: string; count: number; spend: number }>;
  performanceMetrics: {
    avgOnTimeDelivery: number;
    avgQualityScore: number;
    avgResponseTime: number;
  };
}

const VendorManagement = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    businessType: '',
    rating: '',
    location: '',
    category: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [newVendor, setNewVendor] = useState({
    companyName: '',
    contactPerson: {
      name: '',
      designation: '',
      phone: '',
      email: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    businessInfo: {
      gstNumber: '',
      panNumber: '',
      businessType: 'equipment_rental' as const,
      establishedYear: new Date().getFullYear(),
      website: ''
    }
  });

  useEffect(() => {
    fetchVendors();
    fetchVendorStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vendors, filters, searchTerm]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // API call would go here
      const mockVendors: Vendor[] = [
        {
          _id: '1',
          companyName: 'ProLens Equipment Rentals',
          contactPerson: {
            name: 'Rajesh Kumar',
            designation: 'Manager',
            phone: '+91-9876543210',
            email: 'rajesh@prolens.com'
          },
          address: {
            street: '123 Business Park',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
          },
          businessInfo: {
            gstNumber: '27ABCDE1234F1Z5',
            panNumber: 'ABCDE1234F',
            businessType: 'equipment_rental',
            establishedYear: 2018,
            website: 'www.prolens.com'
          },
          services: [
            {
              category: 'Professional Cameras',
              description: 'Canon EOS R5, Sony A7IV, Nikon Z9',
              priceRange: { min: 2000, max: 5000, unit: 'per day' },
              availability: 'always'
            },
            {
              category: 'Lighting Equipment',
              description: 'LED panels, softboxes, reflectors',
              priceRange: { min: 500, max: 2000, unit: 'per day' },
              availability: 'always'
            }
          ],
          ratings: {
            overall: 4.5,
            reliability: 4.7,
            quality: 4.6,
            pricing: 4.2,
            communication: 4.4,
            totalReviews: 38
          },
          financials: {
            totalTransactions: 127,
            totalValue: 485000,
            outstandingAmount: 15000,
            creditLimit: 50000,
            paymentTerms: 'Net 30',
            lastPayment: '2024-12-15'
          },
          contractInfo: {
            contractType: 'annual',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            autoRenewal: true,
            terms: ['30-day payment terms', 'Equipment insurance required', 'Damage charges applicable']
          },
          performance: {
            onTimeDelivery: 92,
            qualityScore: 88,
            responsiveness: 2.5,
            issueResolutionTime: 4.2
          },
          status: 'active',
          documents: [
            { type: 'contract', fileName: 'annual_contract_2024.pdf', uploadedDate: '2024-01-01', verified: true },
            { type: 'gst_certificate', fileName: 'gst_certificate.pdf', uploadedDate: '2024-01-01', verified: true }
          ],
          recentOrders: [
            { orderId: 'ORD-001', date: '2024-12-15', amount: 12000, status: 'completed', description: 'Wedding equipment rental' },
            { orderId: 'ORD-002', date: '2024-12-10', amount: 8500, status: 'completed', description: 'Corporate event setup' }
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-12-18'
        },
        {
          _id: '2',
          companyName: 'Elite Printing Solutions',
          contactPerson: {
            name: 'Priya Sharma',
            designation: 'Sales Manager',
            phone: '+91-9876543211',
            email: 'priya@eliteprinting.com'
          },
          address: {
            street: '456 Industrial Area',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          },
          businessInfo: {
            gstNumber: '07FGHIJ5678K1L2',
            panNumber: 'FGHIJ5678K',
            businessType: 'printing',
            establishedYear: 2015,
            website: 'www.eliteprinting.com'
          },
          services: [
            {
              category: 'Wedding Albums',
              description: 'Premium leather-bound albums with custom design',
              priceRange: { min: 3000, max: 15000, unit: 'per album' },
              availability: 'on_demand'
            },
            {
              category: 'Photo Printing',
              description: 'High-quality photo prints in various sizes',
              priceRange: { min: 10, max: 500, unit: 'per print' },
              availability: 'always'
            }
          ],
          ratings: {
            overall: 4.3,
            reliability: 4.5,
            quality: 4.8,
            pricing: 3.9,
            communication: 4.1,
            totalReviews: 24
          },
          financials: {
            totalTransactions: 89,
            totalValue: 325000,
            outstandingAmount: 8500,
            creditLimit: 30000,
            paymentTerms: 'Net 15',
            lastPayment: '2024-12-12'
          },
          contractInfo: {
            contractType: 'per_project',
            autoRenewal: false,
            terms: ['15-day payment terms', 'Quality guarantee', 'Revision charges may apply']
          },
          performance: {
            onTimeDelivery: 89,
            qualityScore: 94,
            responsiveness: 3.2,
            issueResolutionTime: 6.1
          },
          status: 'active',
          documents: [
            { type: 'gst_certificate', fileName: 'gst_certificate.pdf', uploadedDate: '2024-01-15', verified: true },
            { type: 'bank_details', fileName: 'bank_details.pdf', uploadedDate: '2024-01-15', verified: true }
          ],
          recentOrders: [
            { orderId: 'ORD-003', date: '2024-12-12', amount: 18000, status: 'completed', description: 'Wedding album printing' },
            { orderId: 'ORD-004', date: '2024-12-08', amount: 5500, status: 'pending', description: 'Event photo prints' }
          ],
          createdAt: '2024-01-15',
          updatedAt: '2024-12-18'
        }
      ];
      setVendors(mockVendors);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch vendors'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorStats = async () => {
    try {
      const mockStats: VendorStats = {
        totalVendors: 45,
        activeVendors: 38,
        pendingVerification: 4,
        blacklistedVendors: 3,
        totalSpend: 2850000,
        avgRating: 4.2,
        topCategories: [
          { category: 'Equipment Rental', count: 15, spend: 1200000 },
          { category: 'Printing', count: 12, spend: 850000 },
          { category: 'Transportation', count: 8, spend: 450000 }
        ],
        performanceMetrics: {
          avgOnTimeDelivery: 88,
          avgQualityScore: 91,
          avgResponseTime: 3.2
        }
      };
      setVendorStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch vendor stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...vendors];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.address.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(vendor => vendor.status === filters.status);
    }
    if (filters.businessType) {
      filtered = filtered.filter(vendor => vendor.businessInfo.businessType === filters.businessType);
    }
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(vendor => vendor.ratings.overall >= minRating);
    }
    if (filters.location) {
      filtered = filtered.filter(vendor => 
        vendor.address.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        vendor.address.state.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredVendors(filtered);
  };

  const handleAddVendor = async () => {
    try {
      // API call would go here
      console.log('Adding vendor:', newVendor);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Vendor added successfully'
      });
      setShowAddVendorModal(false);
      await fetchVendors();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add vendor'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'blacklisted': return 'text-red-600 bg-red-100';
      case 'pending_verification': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'equipment_rental': return '📷';
      case 'printing': return '🖨️';
      case 'transportation': return '🚛';
      case 'catering': return '🍽️';
      case 'decoration': return '🎨';
      default: return '🏢';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.5) return 'text-orange-600';
    return 'text-red-600';
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600 mt-1">Manage B2B vendor relationships and performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <NeomorphicButton
            onClick={() => setShowAddVendorModal(true)}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </NeomorphicButton>
          <NeomorphicButton className="border border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </NeomorphicButton>
        </div>
      </div>

      {/* Stats Dashboard */}
      {vendorStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <NeomorphicCard className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{vendorStats.totalVendors}</p>
                <p className="text-xs text-green-600">↑ {vendorStats.activeVendors} active</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-xl font-bold text-green-600">₹{(vendorStats.totalSpend / 100000).toFixed(1)}L</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold text-yellow-600">{vendorStats.avgRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On-Time %</p>
                <p className="text-xl font-bold text-blue-600">{vendorStats.performanceMetrics.avgOnTimeDelivery}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quality Score</p>
                <p className="text-xl font-bold text-purple-600">{vendorStats.performanceMetrics.avgQualityScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </NeomorphicCard>
          
          <NeomorphicCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-orange-600">{vendorStats.pendingVerification}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </NeomorphicCard>
        </div>
      )}

      {/* Filters */}
      <NeomorphicCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search vendors..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending_verification">Pending</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select
              value={filters.businessType}
              onChange={(e) => setFilters({ ...filters, businessType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="equipment_rental">Equipment Rental</option>
              <option value="printing">Printing</option>
              <option value="transportation">Transportation</option>
              <option value="catering">Catering</option>
              <option value="decoration">Decoration</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City or State"
            />
          </div>
          
          <div className="flex items-end">
            <NeomorphicButton
              onClick={() => {
                setFilters({
                  status: '',
                  businessType: '',
                  rating: '',
                  location: '',
                  category: ''
                });
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicCard>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor._id} 
            className="cursor-pointer"
            onClick={() => {
              setSelectedVendor(vendor);
              setShowVendorModal(true);
            }}
          >
            <NeomorphicCard className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getBusinessTypeIcon(vendor.businessInfo.businessType)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.companyName}</h3>
                      <p className="text-sm text-gray-600">{vendor.contactPerson.name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                    {vendor.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Contact & Location */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {vendor.contactPerson.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {vendor.contactPerson.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {vendor.address.city}, {vendor.address.state}
                  </div>
                </div>

                {/* Rating & Performance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-1">
                      <Star className={`w-4 h-4 ${getRatingColor(vendor.ratings.overall)}`} fill="currentColor" />
                      <span className={`font-medium ${getRatingColor(vendor.ratings.overall)}`}>
                        {vendor.ratings.overall}
                      </span>
                      <span className="text-xs text-gray-500">({vendor.ratings.totalReviews})</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">On-time: {vendor.performance.onTimeDelivery}%</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Orders</p>
                      <p className="font-medium">{vendor.financials.totalTransactions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Value</p>
                      <p className="font-medium">₹{(vendor.financials.totalValue / 100000).toFixed(1)}L</p>
                    </div>
                  </div>
                  {vendor.financials.outstandingAmount > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        Outstanding: ₹{vendor.financials.outstandingAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Services Preview */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {vendor.services.slice(0, 2).map((service, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {service.category}
                      </span>
                    ))}
                    {vendor.services.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{vendor.services.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </NeomorphicCard>
          </div>
        ))}
      </div>

      {/* Vendor Detail Modal */}
      <NeomorphicModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title={selectedVendor?.companyName || 'Vendor Details'}
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* Vendor Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="text-gray-900">{selectedVendor.contactPerson.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Designation:</span>
                    <span className="text-gray-900">{selectedVendor.contactPerson.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-900">{selectedVendor.contactPerson.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{selectedVendor.contactPerson.email}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Business Type:</span>
                    <span className="text-gray-900">{selectedVendor.businessInfo.businessType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Established:</span>
                    <span className="text-gray-900">{selectedVendor.businessInfo.establishedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST Number:</span>
                    <span className="text-gray-900">{selectedVendor.businessInfo.gstNumber}</span>
                  </div>
                  {selectedVendor.businessInfo.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website:</span>
                      <span className="text-gray-900">{selectedVendor.businessInfo.website}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedVendor.performance.onTimeDelivery}%</p>
                  <p className="text-xs text-gray-600">On-Time Delivery</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedVendor.performance.qualityScore}%</p>
                  <p className="text-xs text-gray-600">Quality Score</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedVendor.performance.responsiveness}h</p>
                  <p className="text-xs text-gray-600">Avg Response</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{selectedVendor.performance.issueResolutionTime}h</p>
                  <p className="text-xs text-gray-600">Issue Resolution</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Services Offered</h4>
              <div className="space-y-3">
                {selectedVendor.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{service.category}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.availability === 'always' ? 'text-green-600 bg-green-100' :
                        service.availability === 'on_demand' ? 'text-yellow-600 bg-yellow-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {service.availability.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{service.priceRange.min.toLocaleString()} - ₹{service.priceRange.max.toLocaleString()} {service.priceRange.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Orders</h4>
              <div className="space-y-2">
                {selectedVendor.recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderId}</p>
                      <p className="text-sm text-gray-600">{order.description}</p>
                      <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{order.amount.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'text-green-600 bg-green-100' :
                        order.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </NeomorphicModal>

      {/* Add Vendor Modal */}
      <NeomorphicModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        title="Add New Vendor"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={newVendor.companyName}
                onChange={(e) => setNewVendor({ ...newVendor, companyName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person Name *
              </label>
              <input
                type="text"
                value={newVendor.contactPerson.name}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  contactPerson: { ...newVendor.contactPerson, name: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contact person name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <input
                type="text"
                value={newVendor.contactPerson.designation}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  contactPerson: { ...newVendor.contactPerson, designation: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Designation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={newVendor.contactPerson.phone}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  contactPerson: { ...newVendor.contactPerson, phone: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newVendor.contactPerson.email}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  contactPerson: { ...newVendor.contactPerson, email: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                value={newVendor.businessInfo.businessType}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  businessInfo: { ...newVendor.businessInfo, businessType: e.target.value as any }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="equipment_rental">Equipment Rental</option>
                <option value="printing">Printing</option>
                <option value="transportation">Transportation</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoration</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={newVendor.address.city}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  address: { ...newVendor.address, city: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={newVendor.businessInfo.gstNumber}
                onChange={(e) => setNewVendor({ 
                  ...newVendor, 
                  businessInfo: { ...newVendor.businessInfo, gstNumber: e.target.value }
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="GST Number..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <NeomorphicButton
              onClick={() => setShowAddVendorModal(false)}
              className="px-4 py-2 border border-gray-300"
            >
              Cancel
            </NeomorphicButton>
            <NeomorphicButton
              onClick={handleAddVendor}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
            >
              Add Vendor
            </NeomorphicButton>
          </div>
        </div>
      </NeomorphicModal>
    </div>
  );
};

export default VendorManagement;
