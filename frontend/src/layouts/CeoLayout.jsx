import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Clock,
  ShieldCheck,
  Users,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const CeoLayout = () => {
  const { user, isCeo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      ceoOnly: false,
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: CheckSquare,
      ceoOnly: true,
    },
    {
      name: 'Suggested Allocations',
      path: '/ai-allocation',
      icon: Sparkles,
      ceoOnly: true,
      badge: 'AI',
    },
    {
      name: 'Pending Tasks',
      path: '/pending-tasks',
      icon: Clock,
      ceoOnly: true,
    },
    {
      name: 'Approvals',
      path: '/approvals',
      icon: ShieldCheck,
      ceoOnly: true,
    },
    {
      name: 'Team Directory',
      path: '/employees',
      icon: Users,
      ceoOnly: false,
    },
    {
      name: 'My Tasks',
      path: '/my-tasks',
      icon: CheckSquare,
      ceoOnly: false,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.ceoOnly || isCeo);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              TN
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                TaskNera
              </span>
              <span className="text-[11px] text-slate-500">
                {isCeo ? 'Executive Workspace' : 'Team Workspace'}
              </span>
            </div>
          </NavLink>
        </div>

        {/* User Account & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] text-slate-500">
                {isCeo ? 'CEO' : user?.desigTitle || user?.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
            title="Sign out"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-60 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        location.pathname === item.path
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100 text-slate-400 text-[11px] text-center">
            TaskNera Workspace
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
