import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
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
import { Toaster } from '../ui/sonner';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/professor' },
  { icon: User, label: 'Self Evaluation', path: '/professor/self-evaluation' },
  { icon: Users, label: 'Peer Evaluation', path: '/professor/peer-evaluation' },
  { icon: BarChart3, label: 'Results & Reports', path: '/professor/results' },
];

// Use absolute API base to avoid requiring Vite proxy during dev
const API_BASE = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:5000';

export default function ProfessorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRating, setCurrentRating] = useState(null as number | null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [displayName, setDisplayName] = useState('' as string);
  const [displayDept, setDisplayDept] = useState('' as string);
  const [initials, setInitials] = useState('' as string);
  const { token } = useAuth();

  const handleLogout = () => {
    navigate('/auth/login');
  };

  useEffect(() => {
    let isMounted = true;
    async function loadRating() {
      try {
        setLoadingRating(true);
        if (!token) return; // wait until token is available
        // 1) get current user
        const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!meRes.ok) throw new Error(`auth/me failed: ${meRes.status}`);
        const meJson = await meRes.json();
        const user = meJson?.data?.user || meJson?.user || meJson || {};
        const userId = user?.user_id;
        // derive profile fields
        const first = user?.first_name || '';
        const mi = user?.middle_initial || '';
        const last = user?.last_name || '';
        const name = [first, mi, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        const dept = user?.department || user?.department_name || '';
        const init = `${(first||'').charAt(0)}${(last||'').charAt(0)}`.toUpperCase() || (user?.email ? String(user.email).slice(0,2).toUpperCase() : '');
        if (isMounted) {
          if (name) setDisplayName(name);
          if (dept) setDisplayDept(dept);
          if (init) setInitials(init);
        }
        if (!userId) throw new Error('user_id not found');
        // 2) get analytics
        const aRes = await fetch(`${API_BASE}/api/v1/reports/analytics/professor?professor_user_id=${encodeURIComponent(String(userId))}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!aRes.ok) throw new Error(`analytics failed: ${aRes.status}`);
        const aJson = await aRes.json();
        const avg = aJson?.json_output?.topline?.overall_average;
        if (isMounted) setCurrentRating(typeof avg === 'number' ? avg : (avg != null ? Number(avg) : null));
      } catch (err) {
        // leave rating null on error
        if (isMounted) setCurrentRating(null);
      } finally {
        if (isMounted) setLoadingRating(false);
      }
    }
    loadRating();
    return () => { isMounted = false; };
  }, [token]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 relative bg-white shadow-lg border-r border-gray-200">
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

        <div className="absolute bottom-4 left-0 right-0 px-4 space-y-2">
          <div className="w-full p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2">
              <Award className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-900 truncate">Current Rating</p>
                <p className="text-sm font-bold text-blue-700">
                  {loadingRating ? 'Loading…' : (currentRating != null ? `${currentRating.toFixed(1)}/5.0` : 'N/A')}
                </p>
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
                <p className="font-medium">{displayName || '—'}</p>
                <p className="text-xs">{displayDept || ''}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{initials || '?'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        {/* Toaster for notifications (success/error) */}
        <Toaster />
      </div>
    </div>
  );
}