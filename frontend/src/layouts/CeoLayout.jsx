import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Clock,
  ShieldCheck,
  Users,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { TaskNeraLogo } from '../components/common/TaskNeraLogo.jsx';

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
      name: 'Executive Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      ceoOnly: false,
    },
    {
      name: 'Task Directives',
      path: '/tasks',
      icon: CheckSquare,
      ceoOnly: true,
      badge: 'Core',
    },
    {
      name: 'AI Allocation Engine',
      path: '/ai-allocation',
      icon: Sparkles,
      ceoOnly: true,
      badge: 'AI',
    },
    {
      name: 'Pending Tasks & Reports',
      path: '/pending-tasks',
      icon: Clock,
      ceoOnly: true,
    },
    {
      name: 'Approval Centre',
      path: '/approvals',
      icon: ShieldCheck,
      ceoOnly: true,
      badge: 'Executive',
    },
    {
      name: 'Employee Directory',
      path: '/employees',
      icon: Users,
      ceoOnly: false,
    },
    {
      name: 'My Workspace & Tasks',
      path: '/my-tasks',
      icon: CheckSquare,
      ceoOnly: false,
    },
  ];

  const visibleItems = navItems.filter((item) => !item.ceoOnly || isCeo);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Global Executive Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-md border border-brand-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-white font-black tracking-tight text-base">Task</span>
                <span className="text-cyan-400 font-black tracking-tight text-base">Nera</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30 ml-1">
                  Command Centre
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                Executive & AI Task Management Portal
              </span>
            </div>
          </NavLink>
        </div>

        {/* User Account & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs uppercase border border-brand-400/30">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-cyan-300 font-semibold tracking-wide">
                {isCeo ? 'Chief Executive Officer' : user?.desigTitle || user?.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors title='Sign Out'"
            aria-label="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`fixed inset-y-16 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Command Modules
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              v2.0
            </span>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm shadow-brand-500/20 translate-x-0.5'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        location.pathname === item.path
                          ? 'bg-white/20 text-white'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center">
            <p className="text-[11px] font-medium text-slate-500">
              TaskNera CEO Command Centre
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Independent Executive System
            </p>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
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
