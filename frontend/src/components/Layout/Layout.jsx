import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  UserCheck,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:8000/api/notifications/unread-count/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error("Error fetching notification count", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Employee'] },
    { name: 'Assets Directory', path: '/assets', icon: Boxes, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Employee'] },
    { name: 'Allocations & Transfers', path: '/allocations', icon: UserCheck, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Employee'] },
    { name: 'Resource Booking', path: '/bookings', icon: Calendar, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Employee'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Employee'] },
    { name: 'Asset Audits', path: '/audits', icon: ClipboardCheck, roles: ['Admin', 'AssetManager'] },
    { name: 'Organization Setup', path: '/setup', icon: Settings, roles: ['Admin'] },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['Admin', 'AssetManager', 'DepartmentHead'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-neutral-bg">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#2C2C2A] text-white transition-transform duration-300 lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 font-bold text-white text-lg">
              AF
            </div>
            <span className="text-xl font-semibold tracking-wide">AssetFlow</span>
          </div>
          <button 
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'}
                `}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar User profile footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-900 text-primary-100 font-semibold">
              {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-white/55 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Log out"
            className="text-white/60 hover:text-accent-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-border bg-white px-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-neutral-text-secondary hover:text-neutral-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-neutral-text-primary capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications panel */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-neutral-text-secondary hover:text-neutral-text-primary rounded-full hover:bg-neutral-bg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown stub */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-neutral-border bg-white p-2 shadow-lg z-50">
                  <div className="flex items-center justify-between border-b border-neutral-border pb-2 px-3">
                    <span className="font-semibold text-sm">Notifications</span>
                    <span className="text-xs text-primary-600 font-medium cursor-pointer">Mark all read</span>
                  </div>
                  <div className="py-2 text-center text-xs text-neutral-text-muted">
                    No new notifications
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-2 border-l border-neutral-border pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-neutral-text-primary">{user.full_name}</p>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 border border-primary-100 font-semibold">
                {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
