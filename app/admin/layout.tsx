'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/shared/Spinner';
import { Topbar } from '@/components/shared/Topbar';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Smartphone,
  Gift,
  Share2,
  Bell,
  BarChart3,
  FileText,
  Zap,
  Percent,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { label: 'Airtime Conversions', href: '/admin/airtime-conversions', icon: Zap },
  { label: 'Services', href: '/admin/services', icon: Smartphone },
  { label: 'VTU Subsidies', href: '/admin/vtu-subsidies', icon: Percent },
  { label: 'Agents', href: '/admin/agents', icon: Briefcase },
  { label: 'Agent Fund Requests', href: '/admin/agents/fund-requests', icon: FileText },
  { label: 'Offer Codes', href: '/admin/offer-codes', icon: Gift },
  { label: 'Referrals', href: '/admin/referrals', icon: Share2 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/admin/reports', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, activeRole } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      console.log('[AdminLayout] No user, redirecting to login');
      router.push('/auth/login');
      return;
    }

    const isAdmin = user.roles?.some((r) => r === 'admin');
    if (!isAdmin) {
      console.log('[AdminLayout] User is not admin, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // If user has multiple roles but activeRole is not admin, redirect to appropriate dashboard
    if (activeRole && activeRole !== 'admin') {
      const path = activeRole === 'agent' ? '/agent' : '/dashboard';
      console.log('[AdminLayout] Redirecting to', path);
      router.push(path);
      return;
    }

    console.log('[AdminLayout] User is admin, can render');
    setCanRender(true);
  }, [user, activeRole, router]);

  if (!canRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 md:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold">ADMiN</h1>
            <p className="text-gray-400 text-sm">AFRIDataNG</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} mobileMenuOpen={sidebarOpen} />

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <main className="mx-auto px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 ">{children}</main>
        </div>
      </div>
    </div>
  );
}
