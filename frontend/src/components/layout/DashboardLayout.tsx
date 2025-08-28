import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../dashboard/Dashboard';
import StaffManagement from '../staff/StaffManagement';
import BookingManagement from '../bookings/BookingManagement';
import ClientManagement from '../clients/ClientManagement';
import FinanceManagement from '../finance/FinanceManagement';
import InventoryManagement from '../inventory/InventoryManagement';
import AttendanceManagement from '../attendance/AttendanceManagement';
import QuotationManagement from '../quotations/QuotationManagement';
import CompanyManagement from '../company/CompanyManagement';
import ReportsAndAnalytics from '../reports/ReportsAndAnalytics';
import ProfilePage from '../profile/ProfilePage';
import TaskManagement from '../tasks/TaskManagement';
import ProductionWorkflow from '../production/ProductionWorkflow';
import VendorManagement from '../vendors/VendorManagement';
import AdvancedAnalytics from '../analytics/AdvancedAnalytics';
import { AIInsights } from '../ai/AIInsights';
import { MobileApp } from '../mobile/MobileApp';
import { EnhancedAutomation } from '../automation/EnhancedAutomation';
import { SystemIntegration } from '../integration/SystemIntegration';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'staff':
        return <StaffManagement />;
      case 'bookings':
        return <BookingManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'finance':
        return <FinanceManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'quotations':
        return <QuotationManagement />;
      case 'tasks':
        return <TaskManagement />;
      case 'production':
        return <ProductionWorkflow />;
      case 'vendors':
        return <VendorManagement />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'ai-insights':
        return <AIInsights />;
      case 'mobile-app':
        return <MobileApp />;
      case 'automation':
        return <EnhancedAutomation />;
      case 'integrations':
        return <SystemIntegration />;
      case 'company':
        return <CompanyManagement />;
      case 'reports':
        return <ReportsAndAnalytics />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;