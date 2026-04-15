'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getBalance, getTransactions } from '@/lib/api';
import { formatNaira, formatDate } from '@/lib/format';
import type { Balance, TransactionList } from '@/lib/types';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import ErrorMessage from '@/components/ErrorMessage';
import EmptyState from '@/components/EmptyState';
import DepositForm from '@/components/DepositForm';
import TransferForm from '@/components/TransferForm';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactionList, setTransactionList] = useState<TransactionList | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [balanceData, txData] = await Promise.all([
        getBalance(user.id),
        getTransactions(user.id),
      ]);
      setBalance(balanceData);
      setTransactionList(txData);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, loadData]);

  if (authLoading) return <Spinner />;
  if (!isAuthenticated) return null;

  function handleLogout() {
    logout();
    router.replace('/auth/login');
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-medium text-black">
          {user ? `${user.first_name} ${user.last_name}` : ''}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-black transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Balance */}
        <Card>
          <p className="text-sm text-gray-600 mb-1">Balance</p>
          {dataLoading ? (
            <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
          ) : balance ? (
            <p className="text-4xl font-semibold text-black">
              {formatNaira(balance.balance_naira)}
            </p>
          ) : null}
          {dataError && <ErrorMessage message={dataError} />}
        </Card>

        {/* Deposit */}
        <Card>
          <h2 className="text-base font-medium text-black mb-4">Deposit</h2>
          <DepositForm onSuccess={loadData} />
        </Card>

        {/* Transfer */}
        <Card>
          <h2 className="text-base font-medium text-black mb-4">Transfer</h2>
          <TransferForm onSuccess={loadData} />
        </Card>

        {/* Transactions */}
        <Card>
          <h2 className="text-base font-medium text-black mb-4">Recent Transactions</h2>
          {dataLoading ? (
            <Spinner />
          ) : !transactionList || transactionList.items.length === 0 ? (
            <EmptyState message="No transactions yet" />
          ) : (
            <ul className="divide-y divide-gray-200">
              {transactionList.items.map((tx) => {
                const isDeposit = tx.type === 'DEPOSIT';
                return (
                  <li key={tx.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`shrink-0 text-lg leading-none ${
                          isDeposit ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {isDeposit ? '↑' : '↓'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-black truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium shrink-0 ${
                        isDeposit ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}
                      {formatNaira(tx.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
