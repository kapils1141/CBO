import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Menu, Bell, LogOut, RefreshCw } from 'lucide-react';
import { Header } from '../Header';
import { SessionTimer } from '../SessionTimer';
import { Sidebar } from './Sidebar';
import type { NavView } from './Sidebar';
import { AccountCard } from './AccountCard';
import { AccountDetail } from './AccountDetail';
import { NotificationPanel } from './NotificationPanel';
import { ApprovalPanel } from './ApprovalPanel';
import { TransactionRow } from './TransactionRow';
import {
  fetchAccounts,
  fetchNotifications,
  fetchApprovals,
  fetchTransactionSummary,
} from '../../services/bankingApi';
import type {
  Account,
  AccountListResponse,
  Notification,
  Approval,
  TransactionSummaryResponse,
} from '../../services/bankingApi';
import { forgerockService } from '../../services/forgerock';

interface Props {
  userId: string;
  onAbsoluteTimeout: () => void;
  onIdleTimeout: () => void;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const Spinner = () => (
  <div className="w-8 h-8 border-4 border-lloyds-green/20 border-t-lloyds-green rounded-full animate-spin" />
);

const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <p className="text-2xl font-bold text-gray-200 mb-2">{title}</p>
    <p className="text-sm text-gray-400">This section is coming soon.</p>
  </div>
);

export const Dashboard: React.FC<Props> = ({ userId, onAbsoluteTimeout, onIdleTimeout }) => {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [accountData, setAccountData] = useState<AccountListResponse | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [summary, setSummary] = useState<TransactionSummaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive display name from userId — replaced by profile data if available
  const [firstName, setFirstName] = useState(userId);
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('USER');
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accts, notifs, appr, sum] = await Promise.all([
        fetchAccounts(),
        fetchNotifications({ read: false }),
        fetchApprovals(),
        fetchTransactionSummary(),
      ]);
      setAccountData(accts);
      setNotifications(notifs.notifications);
      setApprovals(appr.approvals);
      setSummary(sum);

      // Try to get profile info from user profile endpoint via IG headers
      try {
        const authHeaders = await forgerockService.getAuthHeaders();
        const profile = await fetch('https://cbonline.lloyds.com:3000/api/user/me', {
          credentials: 'include',
          headers: authHeaders,
        });
        if (profile.ok) {
          const p = await profile.json();
          setFirstName(p.firstName ?? userId);
          setLastName(p.lastName ?? '');
          setRole(p.role ?? 'USER');
          setLastLogin(p.lastLogin ?? null);
        }
      } catch {
        // IG may not inject header — fall back to userId
      }
    } catch {
      setError('Unable to connect to banking services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  const selectedAccount: Account | undefined = accountData?.accounts.find(
    (a) => a.accountId === selectedAccountId,
  );

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActiveView('overview'); // stay in overview route, show detail panel
  };

  const recentTransactions = (summary?.summary ?? [])
  .flatMap(() => [])
  .slice(0, 5);

  // Gather recent transactions from summary data
  const summaryItems = summary?.summary ?? [];

  const renderMainContent = () => {
    if (selectedAccount && activeView === 'overview') {
      return (
        <AccountDetail
          account={selectedAccount}
          onBack={() => setSelectedAccountId(null)}
        />
      );
    }

    switch (activeView) {
      case 'overview':
        return <OverviewContent />;
      case 'approvals':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Pending Approvals</h2>
            <ApprovalPanel
              approvals={approvals}
              onUpdate={setApprovals}
              compact={false}
            />
          </div>
        );
      default:
        return <PlaceholderView title={activeView.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />;
    }
  };

  const OverviewContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Welcome banner */}
      <div className="bg-lloyds-gradient text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-1">
          {greeting()}, {firstName}
        </h2>
        {lastLogin && (
          <p className="text-sm opacity-75">
            Last login: {formatTimestamp(lastLogin)}
          </p>
        )}
      </div>

      {/* Account cards */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Your Accounts</h3>
        {accountData && accountData.accounts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {accountData.accounts.map((acct) => (
              <AccountCard key={acct.accountId} account={acct} onClick={handleAccountClick} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4">No accounts found.</p>
        )}
      </div>

      {/* Two-column: transactions + approvals */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">Recent Transactions</h3>
            {accountData && accountData.accounts.length > 0 && (
              <button
                onClick={() => handleAccountClick(accountData.accounts[0].accountId)}
                className="text-xs text-lloyds-green hover:underline"
              >
                View all
              </button>
            )}
          </div>
          {summaryItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transaction data available.</p>
          ) : (
            <div className="space-y-1">
              {summaryItems.slice(0, 5).map((s) => (
                <div key={s.accountId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.accountName}</p>
                    <p className="text-xs text-gray-400">{s.transactionCount} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${s.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.netMovement >= 0 ? '+' : ''}{formatCurrency(s.netMovement, s.currency)}
                    </p>
                    <p className="text-[10px] text-gray-400">{summary?.period}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approvals */}
        <ApprovalPanel
          approvals={approvals}
          onUpdate={setApprovals}
          compact
          onViewAll={() => setActiveView('approvals')}
        />
      </div>

      {/* Notifications */}
      <NotificationPanel
        notifications={notifications}
        onUpdate={setNotifications}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-lloyds-gradient text-white">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white/80 hover:text-white"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-full p-1.5">
                <svg width="24" height="24" viewBox="0 0 100 100" className="text-lloyds-green fill-current">
                  <path d="M75,30 C65,15 45,15 35,30 C25,45 25,65 40,80 C50,90 70,90 80,80 C95,65 95,45 85,30 Z" />
                  <path d="M20,40 C10,50 10,70 25,85 C35,95 55,95 65,85" stroke="currentColor" fill="none" strokeWidth="5" />
                </svg>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-bold tracking-tight uppercase leading-none">Lloyds Bank</span>
                <span className="text-[9px] opacity-70 uppercase tracking-widest">Commercial Banking Online</span>
              </div>
            </div>
          </div>

          {/* Right: bell + timer + user + logout */}
          <div className="flex items-center gap-4">
            <button
              className="relative text-white/80 hover:text-white"
              onClick={() => setActiveView('overview')}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <SessionTimer
              absoluteMinutes={480}
              idleMinutes={10}
              onAbsoluteTimeout={onAbsoluteTimeout}
              onIdleTimeout={onIdleTimeout}
            />

            <div className="hidden sm:flex flex-col items-end">
              <p className="text-xs font-semibold leading-none">{firstName} {lastName}</p>
              <p className="text-[10px] opacity-60 leading-none mt-0.5">{role}</p>
            </div>

            <button
              onClick={() => forgerockService.logout()}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white border border-white/20 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={(v) => {
          setActiveView(v);
          setSelectedAccountId(null);
        }}
        pendingCount={pendingApprovals.length}
        role={role}
        firstName={firstName}
        lastName={lastName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="md:ml-60 pt-[64px] flex-1 p-4 md:p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Spinner />
            <p className="text-sm text-gray-400 mt-4">Loading your dashboard...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">{error}</p>
            <button
              onClick={loadAll}
              className="flex items-center gap-2 mt-4 px-5 py-2.5 bg-lloyds-green text-white rounded-lg hover:bg-lloyds-dark text-sm font-medium"
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && renderMainContent()}
      </main>
    </div>
  );
};
