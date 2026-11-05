import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getInitials } from '../constants/neraTheme.js';

export const NeraLayout = () => {
  const { user, isCeo, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ceoName = 'Sheetal Bedi';
  const displayName = isCeo
    ? ceoName
    : user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Signed in';
  const initial = getInitials(displayName).slice(0, 1) || 'T';

  // Exact navigation arrays matching Nera Command Hub
  const ceoNavItems = [
    { to: '/', label: 'Command Centre', icon: LayoutDashboard },
    { to: '/tasks', label: 'Task Ledger', icon: CheckSquare },
    { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
    { to: '/team', label: 'People & Load', icon: Users },
    { to: '/ai', label: 'AI Control', icon: Bot },
  ];

  const employeeNavItems = [
    { to: '/', label: 'My Workspace', icon: LayoutDashboard },
    { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  ];

  const currentNavItems = isCeo ? ceoNavItems : employeeNavItems;

  const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="px-5 pb-7 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal text-[13px] font-semibold text-primary-foreground shadow-sm">
            T
          </div>
          <div className="leading-tight">
            <p className="font-display text-[17px] tracking-wide text-foreground">
              TaskNera
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {isCeo ? 'CEO Command' : 'Workspace'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[0.06] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] font-medium'
                    : 'text-muted-foreground hover:bg-white/[0.035] hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-signal' : 'text-muted-foreground/80 group-hover:text-foreground'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile card at bottom */}
      <div className="mx-3 mb-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-xs font-medium text-foreground">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {isCeo ? 'Chief Executive' : 'Employee'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-signal selection:text-primary-foreground">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[0.06] bg-[hsl(240_7%_5%)]/80 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[260px] border-r border-white/[0.08] bg-[hsl(240_7%_5%)] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main page body */}
      <div className="lg:pl-[248px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-display text-base tracking-wide text-foreground">
            TaskNera
          </p>
          <div className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-[11px] font-medium text-foreground">
            {initial}
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="mx-auto w-full max-w-[1400px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
