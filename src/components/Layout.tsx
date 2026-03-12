import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, CreditCard, Settings, Compass, Box, Layers, User, Bell } from 'lucide-react';
import { clsx } from 'clsx';

import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const location = useLocation();
  const { user, displayName, authError } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Savings', path: '/savings', icon: PiggyBank },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white flex flex-col md:flex-row font-sans selection:bg-[#E5D3B3] selection:text-black">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-20 lg:w-64 bg-[#141518] border-r border-white/5 flex-col transition-all duration-300">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-white/5">
          <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-[#E5D3B3] flex items-center justify-center text-[#141518]">
            <PiggyBank size={20} />
          </div>
          <span className="font-semibold text-lg hidden lg:block tracking-wide">KwarTrack</span>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
                title={item.name}
              >
                <Icon className={clsx('w-5 h-5', isActive ? 'text-[#E5D3B3]' : 'text-zinc-400')} />
                <span className="hidden lg:block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0D0D0F]/80 backdrop-blur-lg sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
              <img src={user?.photoURL || "https://picsum.photos/seed/avatar/100/100"} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{getGreeting()}</p>
              <h2 className="text-sm font-semibold">{displayName || 'User'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 relative"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#E5D3B3] rounded-full"></span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1A1C20] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden p-4">
                  <h3 className="font-medium text-white mb-3 text-sm border-b border-white/5 pb-2">Notifications</h3>
                  <div className="text-xs text-zinc-400 space-y-3">
                    <p>Welcome to KwarTrack! Your dashboard is now synced with Supabase.</p>
                  </div>
                </div>
              )}
            </div>
            <Link
              to={location.pathname === '/settings' ? '/' : '/settings'}
              className={clsx(
                "w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-colors",
                location.pathname === '/settings' ? "bg-[#E5D3B3] text-[#141518]" : "text-zinc-400"
              )}
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-sm">
                <strong>Supabase Error:</strong> {authError}. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.
              </p>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-[#1A1C20]/95 backdrop-blur-md border border-white/10 rounded-full z-50 flex justify-around items-center p-2 shadow-2xl">
        {navItems.filter(item => item.name !== 'Settings').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-300',
                isActive ? 'bg-[#E5D3B3] text-[#141518]' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-5 h-5" />
              {isActive && <span className="text-sm font-semibold">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
