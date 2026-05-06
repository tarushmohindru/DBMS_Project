import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  href:   string;
  label:  string;
  icon:   string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard',        label: 'Dashboard',        icon: '⊞' },
  { href: '/plants',           label: 'Plants',           icon: '🏭', roles: ['company_admin', 'regulatory_authority'] },
  { href: '/production-logs',  label: 'Production Logs',  icon: '📊', roles: ['company_admin', 'regulatory_authority'] },
  { href: '/credits',          label: 'Carbon Credits',   icon: '🌿' },
  { href: '/wallet',           label: 'Wallet',           icon: '💼', roles: ['company_admin'] },
  { href: '/marketplace',      label: 'Marketplace',      icon: '🏪' },
  { href: '/transactions',     label: 'Transactions',     icon: '⇄'  },
  { href: '/compliance',       label: 'Compliance',       icon: '📋' },
  { href: '/reports',          label: 'Reports',          icon: '📈', roles: ['regulatory_authority', 'marketplace_admin'] },
];

const roleLabel: Record<UserRole, string> = {
  company_admin:         'Company Admin',
  regulatory_authority:  'Regulatory Authority',
  marketplace_admin:     'Marketplace Admin',
};

const roleBadgeColor: Record<UserRole, string> = {
  company_admin:         'bg-green-100 text-green-800',
  regulatory_authority:  'bg-blue-100 text-blue-800',
  marketplace_admin:     'bg-purple-100 text-purple-800',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const visibleItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <div>
            <div className="font-bold text-sm leading-tight">Carbon Credit</div>
            <div className="text-xs text-gray-400 leading-tight">Marketplace</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map(item => {
            const active = router.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-eco-600 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="mb-2">
          <div className="text-sm font-medium text-white">{user.username}</div>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor[user.role]}`}>
            {roleLabel[user.role]}
          </span>
        </div>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="w-full mt-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
