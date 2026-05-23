import React from 'react';
import { Landmark, PiggyBank, Lock } from 'lucide-react';
import type { Account } from '../../services/bankingApi';

interface Props {
  account: Account;
  onClick: (accountId: string) => void;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function maskAccountNumber(acctNum: string): string {
  return `****${acctNum.slice(-4)}`;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CURRENT: {
    icon: <Landmark size={20} />,
    label: 'Current Account',
    color: 'bg-lloyds-green text-white',
  },
  SAVINGS: {
    icon: <PiggyBank size={20} />,
    label: 'Savings Account',
    color: 'bg-blue-600 text-white',
  },
  FIXED_DEPOSIT: {
    icon: <Lock size={20} />,
    label: 'Fixed Deposit',
    color: 'bg-amber-600 text-white',
  },
};

export const AccountCard: React.FC<Props> = ({ account, onClick }) => {
  const cfg = typeConfig[account.type] ?? {
    icon: <Landmark size={20} />,
    label: account.type,
    color: 'bg-gray-600 text-white',
  };

  return (
    <button
      onClick={() => onClick(account.accountId)}
      className="bg-white rounded-xl login-card-shadow p-5 text-left min-w-[260px] hover:shadow-md transition-shadow border border-gray-100 cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">{cfg.label}</p>
          <p className="text-sm font-semibold text-gray-700">{account.name}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(account.balance, account.currency)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Available: {formatCurrency(account.availableBalance, account.currency)}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
        <span>{maskAccountNumber(account.accountNumber)}</span>
        <span>{account.sortCode}</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            account.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {account.status}
        </span>
      </div>
    </button>
  );
};
