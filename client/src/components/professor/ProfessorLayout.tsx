import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  BarChart3, 
  LogOut,
  GraduationCap,
  BookOpen,
  Award
} from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/professor' },
  { icon: User, label: 'Self Evaluation', path: '/professor/self-evaluation' },
  { icon: Users, label: 'Peer Evaluation', path: '/professor/peer-evaluation' },
  { icon: BarChart3, label: 'Results & Reports', path: '/professor/results' },
];

export default function ProfessorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Evalytics</h2>
              <p className="text-sm text-gray-500">Professor Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-l-4 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Current Rating</p>
                <p className="text-lg font-bold text-blue-700">4.6/5.0</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start space-x-2 border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-800">
                DMMMSU-SLUC Faculty Evaluation Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 text-right">
                <p className="font-medium">Dr. Maria Santos</p>
                <p className="text-xs">Computer Science Department</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">MS</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}