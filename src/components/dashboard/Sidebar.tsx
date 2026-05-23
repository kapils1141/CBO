import React, { useState } from 'react';
import {
  LayoutDashboard, Landmark, PiggyBank, Lock,
  Send, Clock, History, FileText,
  Users, BookOpen, TrendingUp,
  UserCog, ClipboardList, HelpCircle,
  Shield, Phone, ChevronDown, ChevronRight, X,
} from 'lucide-react';

export type NavView =
  | 'overview'
  | 'account-current'
  | 'account-savings'
  | 'account-fixed'
  | 'payment-bacs'
  | 'payment-chaps'
  | 'payment-faster'
  | 'payment-swift'
  | 'approvals'
  | 'payment-history'
  | 'payment-templates'
  | 'payees'
  | 'statements'
  | 'fx-rates'
  | 'manage-users'
  | 'audit-log'
  | 'how-to-pay'
  | 'security-centre'
  | 'contact-us';

interface Props {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  pendingCount: number;
  role: string;
  firstName: string;
  lastName: string;
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  view: NavView;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  expandable?: boolean;
  subItems?: NavItem[];
}

export const Sidebar: React.FC<Props> = ({
  activeView,
  onNavigate,
  pendingCount,
  role,
  firstName,
  lastName,
  open,
  onClose,
}) => {
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const isAdmin = role === 'ADMIN' || role === 'CORPORATE_ADMIN';

  const groups: NavGroup[] = [
    {
      title: 'Overview',
      items: [{ view: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> }],
    },
    {
      title: 'Accounts',
      items: [
        { view: 'account-current', label: 'Current Account', icon: <Landmark size={16} /> },
        { view: 'account-savings', label: 'Savings Account', icon: <PiggyBank size={16} /> },
        { view: 'account-fixed', label: 'Fixed Deposits', icon: <Lock size={16} /> },
      ],
    },
    {
      title: 'Payments',
      items: [
        { view: 'approvals', label: 'Pending Approvals', icon: <Clock size={16} />, badge: pendingCount },
        { view: 'payment-history', label: 'Payment History', icon: <History size={16} /> },
        { view: 'payment-templates', label: 'Payment Templates', icon: <FileText size={16} /> },
      ],
    },
    {
      title: 'Services',
      items: [
        { view: 'payees', label: 'Manage Payees', icon: <Users size={16} /> },
        { view: 'statements', label: 'Statements', icon: <BookOpen size={16} /> },
        { view: 'fx-rates', label: 'FX Rates', icon: <TrendingUp size={16} /> },
      ],
    },
    ...(isAdmin
      ? [{
          title: 'Admin',
          items: [
            { view: 'manage-users' as NavView, label: 'Manage Users', icon: <UserCog size={16} /> },
            { view: 'audit-log' as NavView, label: 'Audit Log', icon: <ClipboardList size={16} /> },
          ],
        }]
      : []),
    {
      title: 'Help',
      items: [
        { view: 'how-to-pay', label: 'How to Pay', icon: <HelpCircle size={16} /> },
        { view: 'security-centre', label: 'Security Centre', icon: <Shield size={16} /> },
        { view: 'contact-us', label: 'Contact Us', icon: <Phone size={16} /> },
      ],
    },
  ];

  const makePaymentItems: NavItem[] = [
    { view: 'payment-bacs', label: 'BACS', icon: <Send size={14} /> },
    { view: 'payment-chaps', label: 'CHAPS', icon: <Send size={14} /> },
    { view: 'payment-faster', label: 'Faster Payments', icon: <Send size={14} /> },
    { view: 'payment-swift', label: 'SWIFT', icon: <Send size={14} /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="bg-lloyds-gradient p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{firstName} {lastName}</p>
            <p className="text-[10px] opacity-70 uppercase tracking-wider mt-0.5">{role}</p>
          </div>
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <div key={group.title} className="mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2">
              {group.title}
            </p>

            {/* Make a Payment expandable — injected into Payments group */}
            {group.title === 'Payments' && (
              <>
                <button
                  onClick={() => setPaymentsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md mx-1"
                >
                  <span className="flex items-center gap-2.5">
                    <Send size={16} /> Make a Payment
                  </span>
                  {paymentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {paymentsOpen && (
                  <div className="ml-4 border-l border-gray-100 pl-2 mb-1">
                    {makePaymentItems.map((item) => (
                      <NavButton
                        key={item.view}
                        item={item}
                        active={activeView === item.view}
                        onNavigate={(v) => { onNavigate(v); onClose(); }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {group.items.map((item) => (
              <NavButton
                key={item.view}
                item={item}
                active={activeView === item.view}
                onNavigate={(v) => { onNavigate(v); onClose(); }}
              />
            ))}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20 pt-[64px]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

const NavButton: React.FC<{
  item: NavItem;
  active: boolean;
  onNavigate: (v: NavView) => void;
}> = ({ item, active, onNavigate }) => (
  <button
    onClick={() => onNavigate(item.view)}
    className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-md mx-1 transition-colors ${
      active
        ? 'bg-lloyds-green text-white font-semibold'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
    style={{ width: 'calc(100% - 8px)' }}
  >
    <span className="flex items-center gap-2.5">
      {item.icon}
      {item.label}
    </span>
    {item.badge !== undefined && item.badge > 0 && (
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white text-lloyds-green' : 'bg-amber-500 text-white'
        }`}
      >
        {item.badge}
      </span>
    )}
  </button>
);
