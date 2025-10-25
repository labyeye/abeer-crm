import React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  IndianRupee,
  CreditCard,
  Package,
  Building2,
  X,
  Clock,
  FileText,
  CheckSquare,
  Star,
  HandCoins,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../images/logo.png";
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      permission: "dashboard",
      color: "primary",
    },
    {
      id: "company",
      name: "Branchs",
      icon: Building2,
      permission: "company_manage",
      roles: ["chairman"],
      color: "purple",
    },
    
    {
      id: "staff",
      name: "Staffs",
      icon: Users,
      permission: "staff_manage",
      roles: ["chairman", "admin"],
      color: "teal",
    },
    {
      id: "salary",
      name: "Salaries",
      icon: IndianRupee,
      permission: "salary_manage",
      roles: ["chairman", "admin"],
      color: "teal",
    },

    {
      id: "clients",
      name: "Ledgers",
      icon: UserCheck,
      permission: "clients",
      roles: ["chairman", "admin"],
      color: "success",
    },
    {
      id: "bookings",
      name: "Bookings",
      icon: Calendar,
      permission: "bookings",
      roles: ["chairman", "admin"],
      color: "secondary",
    },
    {
      id: "assigned-bookings",
      name: "Assigned Bookings",
      icon: Calendar,
      permission: "bookings",
      roles: ["staff"],
      color: "secondary",
    },
    {
      id: "finance",
      name: "Finances",
      icon: IndianRupee,
      permission: "finance",
      roles: ["chairman", "admin"],
      color: "warning",
    },
    {
      id: "loans",
      name: "Loans",
      icon: HandCoins,
      permission: "loans",
      roles: ["chairman", "admin", "manager"],
      color: "indigo",
    },
    {
      id: "receive-payments",
      name: "Receive Payments",
      icon: CreditCard,
      permission: "payments",
      roles: ["chairman", "admin", "branch_admin"],
      color: "success",
    },
    {
      id: "inventory",
      name: "Inventories",
      icon: Package,
      permission: "inventory",
      roles: ["chairman", "admin"],
      color: "indigo",
    },
    {
      id: "attendance",
      name: "Attendance",
      icon: Clock,
      permission: "attendance",
      roles: ["chairman", "admin", "staff"],
      color: "pink",
    },

    {
      id: "tasks",
      name: "Tasks",
      icon: CheckSquare,
      permission: "tasks",
      roles: ["chairman", "company_admin", "branch_head", "staff"],
      color: "success",
    },
    {
      id: "daily-expenses",
      name: "Expenses",
      icon: IndianRupee,
      permission: "daily_expenses",
      roles: ["chairman", "company_admin", "branch_head"],
      color: "error",
    },
    {
      id: "categories",
      name: "Categories",
      icon: Star,
      permission: "categories",
      roles: ["chairman", "company_admin", "branch_head", "admin"],
      color: "purple",
    },
    {
      id: "reports",
      name: "Reports",
      icon: FileText,
      permission: "reports",
      roles: ["chairman", "admin", "company_admin", "branch_head"],
      color: "primary",
    },
    {
      id: "special-reports",
      name: "Special Reports",
      icon: FileText,
      permission: "special_reports",
      roles: ["chairman", "admin", "company_admin", "branch_head"],
      color: "purple",
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center">
                <img src={logo} alt="Logo" className="w-16 h-16" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">
                  Abeer Motion Picture
                </h1>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <div className="space-y-0.5 pb-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                    ${
                      isActive
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="bg-[#E2EDF8] rounded-md w-8 h-8 flex items-center justify-center">
                    <Icon
                    className={`w-[18px] h-[18px] ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  />
                  </div>
                  <span
                    className={`text-[13px] font-medium ${
                      isActive ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.id === "notifications" && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                      3
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
