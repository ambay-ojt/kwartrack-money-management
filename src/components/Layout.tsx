import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, CreditCard, Settings, Compass, Box, Layers, User } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const location = useLocation();

  const desktopNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Savings', path: '/savings', icon: PiggyBank },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const mobileNavItems = [
    { name: 'Explore', path: '/', icon: Compass },
    { name: 'Expenses', path: '/expenses', icon: Box },
    { name: 'Savings', path: '/savings', icon: Layers },
    { name: 'Profile', path: '/settings', icon: User },
  ];

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
          {desktopNavItems.map((item) => {
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
        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-[#1A1C20]/95 backdrop-blur-md border border-white/10 rounded-full z-50 flex justify-between items-center p-2 shadow-2xl">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/settings' && location.pathname === '/settings');
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
