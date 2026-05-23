import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { fetchTransactions } from '../../services/bankingApi';
import type { Account, Transaction } from '../../services/bankingApi';
import { TransactionRow } from './TransactionRow';

interface Props {
  account: Account;
  onBack: () => void;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export const AccountDetail: React.FC<Props> = ({ account, onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTransactions(account.accountId, {
      page,
      size: 10,
      ...(filterType && { type: filterType }),
      ...(filterFrom && { from: filterFrom }),
      ...(filterTo && { to: filterTo }),
    })
      .then((data) => {
        if (cancelled) return;
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load transactions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [account.accountId, page, filterType, filterFrom, filterTo]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-lloyds-green font-medium mb-6 hover:underline"
      >
        <ArrowLeft size={16} /> Back to Overview
      </button>

      {/* Account header */}
      <div className="bg-lloyds-gradient text-white rounded-xl p-6 mb-6">
        <p className="text-sm opacity-80 mb-1">{account.name}</p>
        <p className="text-3xl font-bold mb-2">{formatCurrency(account.balance, account.currency)}</p>
        <div className="flex gap-6 text-sm opacity-80">
          <span>Available: {formatCurrency(account.availableBalance, account.currency)}</span>
          <span>Sort code: {account.sortCode}</span>
          <span>Account: ****{account.accountNumber.slice(-4)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <Filter size={16} className="text-gray-400 mt-auto mb-1" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus-lloyds"
          >
            <option value="">All</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus-lloyds"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus-lloyds"
          />
        </div>
        {(filterType || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterType(''); setFilterFrom(''); setFilterTo(''); setPage(0); }}
            className="text-xs text-red-500 hover:underline mt-auto mb-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Transactions</h3>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-lloyds-green/20 border-t-lloyds-green rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No transactions found for the selected filters.</p>
        )}

        {!loading && !error && transactions.map((tx) => (
          <TransactionRow key={tx.transactionId} tx={tx} />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 text-sm text-lloyds-green disabled:text-gray-300 hover:underline disabled:no-underline"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-sm text-lloyds-green disabled:text-gray-300 hover:underline disabled:no-underline"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
