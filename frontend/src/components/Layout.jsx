import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  Clock,
  LifeBuoy,
  BarChart3,
  LogOut,
  Bell,
  Menu,
  X,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;

  // Navigation Config based on Role
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Developer', 'Client'] },
    { name: 'Projects', path: '/projects', icon: Briefcase, roles: ['Admin', 'Developer', 'Client'] },
    { name: 'Tasks & Kanban', path: '/tasks', icon: KanbanSquare, roles: ['Admin', 'Developer'] },
    { name: 'Timesheets', path: '/timesheets', icon: Clock, roles: ['Admin', 'Developer'] },
    { name: 'Support Tickets', path: '/tickets', icon: LifeBuoy, roles: ['Admin', 'Client'] },
    { name: 'Reports Center', path: '/reports', icon: BarChart3, roles: ['Admin'] },
    { name: 'Team & Clients', path: '/users', icon: Users, roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Developer': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Client': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-lg transition-all duration-300 relative z-20 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              S
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SprintFlow
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-md bg-slate-900 border border-slate-800"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/15'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'} />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all duration-200"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* --- MOBILE MENU DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Content */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-950 border-r border-slate-800 p-6 z-50 animate-slide-right">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-lg">
                  S
                </div>
                <span className="font-extrabold text-lg text-white">SprintFlow</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-md border border-slate-800 bg-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* --- HEADER NAVBAR --- */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md relative z-10 no-print">
          {/* Left: Mobile hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-slate-100 p-2 rounded-md hover:bg-slate-900 border border-slate-800"
            >
              <Menu size={20} />
            </button>
            <h2 className="hidden md:block font-semibold text-slate-300 text-sm tracking-wide">
              {location.pathname === '/' ? 'DASHBOARD OVERVIEW' : location.pathname.substring(1).toUpperCase()}
            </h2>
          </div>

          {/* Right: Notifications & User profile */}
          <div className="flex items-center gap-4">
            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg border border-slate-800 transition-all ${
                  showNotifications ? 'bg-slate-900 text-indigo-400 border-indigo-500/30' : 'bg-slate-950 text-slate-400 hover:text-slate-100'
                }`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce border border-dark-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 max-h-[400px] flex flex-col bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                    <span className="font-semibold text-sm text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3.5 hover:bg-slate-900/30 transition-colors relative flex items-start gap-3 ${
                            !notif.read ? 'bg-indigo-600/5' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {notif.type.includes('Task') ? (
                              <CheckCircle size={16} className="text-indigo-400" />
                            ) : (
                              <AlertCircle size={16} className="text-amber-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-slate-600 block mt-1.5">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif._id)}
                              className="text-[10px] text-indigo-400 hover:underline shrink-0"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.name}</p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 leading-none ${getRoleColor(role)}`}>
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN PAGE VIEWPORT --- */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
