import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Toaster } from '../ui/sonner';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  LogOut,
  Bell,
  Settings
} from 'lucide-react';

export default function SupervisorLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/auth/login');
  };

  const navigationItems = [
    {
      href: '/supervisor/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      isActive: location.pathname === '/supervisor/dashboard' || location.pathname === '/supervisor/'
    },
    {
      href: '/supervisor/evaluations/professors',
      icon: FileText,
      label: 'Evaluate Professors',
      isActive: location.pathname === '/supervisor/evaluations/professors' || location.pathname.startsWith('/supervisor/evaluations/professors/')
    },
    {
      href: '/supervisor/evaluations/templates',
      icon: FileText,
      label: 'Template Generator',
      isActive: location.pathname === '/supervisor/evaluations/templates' || location.pathname.startsWith('/supervisor/evaluations/templates/')
    },
    {
      href: '/supervisor/results-reports',
      icon: BarChart3,
      label: 'Results & Reports',
      isActive: location.pathname === '/supervisor/results-reports' || location.pathname === '/supervisor/reports' || location.pathname.startsWith('/supervisor/results-reports/')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <LayoutDashboard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">Evalytics</h1>
                  <p className="text-sm text-gray-600">Supervisor Dashboard</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <LayoutDashboard className="h-3 w-3 mr-1" />
                Supervisor
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm">Dr. Jane Smith</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.href} className="mb-1">
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      item.isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}