'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/shared/Spinner';
import { Topbar } from '@/components/shared/Topbar';
import {
  LayoutDashboard,
  Wallet,
  Users,
  TrendingUp,
  FileText,
  Percent,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const agentNavItems = [
  { label: 'Dashboard', href: '/agent', icon: LayoutDashboard },
  { label: 'My Wallet', href: '/agent/wallet', icon: Wallet },
  { label: 'Customers', href: '/agent/customers', icon: Users },
  { label: 'Commissions', href: '/agent/commissions', icon: TrendingUp },
  { label: 'Fund Requests', href: '/agent/fund-requests', icon: FileText },
  { label: 'My Rates', href: '/agent/rates', icon: Percent },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, activeRole } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const isAgent = user.roles?.some((r) => r === 'agent');
    if (!isAgent) {
      router.push('/dashboard');
      return;
    }

    if (activeRole && activeRole !== 'agent') {
      const path = activeRole === 'admin' ? '/admin' : '/dashboard';
      router.push(path);
      return;
    }

    setCanRender(true);
  }, [user, activeRole, router]);

  if (!canRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 md:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4a5ff7] flex items-center justify-center">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">Agent Portal</h1>
                <p className="text-white/50 text-xs">AFRIDataNG</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {agentNavItems.map((item) => {
              const isActive = item.href === '/agent'
                ? window.location.pathname === '/agent'
                : window.location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to dashboard link */}
          <div className="px-3 py-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} mobileMenuOpen={sidebarOpen} />

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content — fluid */}
        <div className="flex-1 overflow-y-auto">
          <main className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
