import React from 'react';
import type { Transaction } from '../../services/bankingApi';

interface Props {
  tx: Transaction;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

const methodColors: Record<string, string> = {
  BACS: 'bg-blue-100 text-blue-700',
  CHAPS: 'bg-purple-100 text-purple-700',
  'Faster Payments': 'bg-green-100 text-green-700',
  SWIFT: 'bg-amber-100 text-amber-700',
};

export const TransactionRow: React.FC<Props> = ({ tx }) => {
  const isCredit = tx.type === 'CREDIT';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{formatDate(tx.date)}</span>
          {tx.paymentMethod && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${methodColors[tx.paymentMethod] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {tx.paymentMethod}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
        </p>
        <p className="text-[10px] text-gray-400">Bal: {formatCurrency(tx.balance, tx.currency)}</p>
      </div>
    </div>
  );
};
