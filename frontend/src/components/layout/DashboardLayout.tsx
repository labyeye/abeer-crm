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
import BranchManagement from '../branch/BranchManagement';
import ReportsAndAnalytics from '../reports/ReportsAndAnalytics';
import ProfilePage from '../profile/ProfilePage';
import TaskManagement from '../tasks/TaskManagement';
import VendorManagement from '../vendors/VendorManagement';
import AdvancedAnalytics from '../analytics/AdvancedAnalytics';
import { AIInsights } from '../ai/AIInsights';
import { EnhancedAutomation } from '../automation/EnhancedAutomation';
import { SystemIntegration } from '../integration/SystemIntegration';
import DailyExpenses from '../dailyExpenses/DailyExpenses';

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
        return <DailyExpenses />; 
      case 'vendors':
        return <VendorManagement />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'ai-insights':
        return <AIInsights />;
      case 'automation':
        return <EnhancedAutomation />;
      case 'integrations':
        return <SystemIntegration />;
      case 'company':
        return <BranchManagement />;
      case 'reports':
        return <ReportsAndAnalytics />;
      case 'profile':
        return <ProfilePage />;
      case 'daily-expenses':
        return <DailyExpenses />;
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