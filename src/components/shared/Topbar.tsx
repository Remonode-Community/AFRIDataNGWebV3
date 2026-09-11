'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { RoleSwitcher } from './RoleSwitcher';

interface TopbarProps {
  onMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle,
  mobileMenuOpen = false,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeRole } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMounted]);

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-[#fee2e2] text-[#991b1b]';
      case 'agent':
        return 'bg-[#dbeafe] text-[#1e40af]';
      default:
        return 'bg-[#f0fdf4] text-[#166534]';
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Shield className="h-3.5 w-3.5" />;
      case 'agent':
        return <Briefcase className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  // Use activeRole (which is now the primary role) instead of first role
  const userRole = activeRole || user?.roles?.[0] || 'customer';
  const userInitials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
        .toUpperCase()
    : '?';

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Menu toggle */}
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Center/Right section - Flex spacer and user menu */}
          <div className="flex-1" />

          {/* Role Switcher - Only visible if user has multiple roles */}
          {user && user.roles && user.roles.length > 1 && (
            <div className="mr-4">
              <RoleSwitcher />
            </div>
          )}

          {/* User Profile Menu */}
          {user ? (
            <div className="relative" ref={menuRef}>
              {/* User Profile Button */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-[#4a5ff7] flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials}
                </div>

                {/* Name and Role */}
                <div className="hidden sm:flex flex-col items-start">
                  <div className="text-sm font-semibold text-[#111827]">
                    {user.first_name} {user.last_name}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(
                      userRole
                    )}`}
                  >
                    {getRoleIcon(userRole)}
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </div>
                </div>

                {/* Chevron */}
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    showUserMenu ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                  {/* User Info Section */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#4a5ff7] flex items-center justify-center text-white font-semibold">
                        {userInitials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {user.first_name}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mt-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor(
                          userRole
                        )}`}
                      >
                        {getRoleIcon(userRole)}
                        <span>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="mt-3 space-y-1 text-xs text-[#6b7280]">
                      <p>
                        Email:{' '}
                        <span
                          className={
                            user.email_verified_at
                              ? 'text-[#16a34a] font-medium'
                              : 'text-[#f59e0b] font-medium'
                          }
                        >
                          {user.email_verified_at ? '✓ Verified' : '⚠ Pending'}
                        </span>
                      </p>
                      <p>
                        Phone:{' '}
                        <span
                          className={
                            user.phone_verified_at
                              ? 'text-[#16a34a] font-medium'
                              : 'text-[#f59e0b] font-medium'
                          }
                        >
                          {user.phone_verified_at ? '✓ Verified' : '⚠ Pending'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Settings */}
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    {/* Account */}
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111827] hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sign In / Register for unauthenticated users */
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-semibold text-[#4a5ff7] hover:bg-[#f7f8ff] rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#4a5ff7] rounded-lg hover:bg-[#3a4fd7] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
