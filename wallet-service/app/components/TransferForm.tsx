'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { transfer, getWallets } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Wallet } from '@/lib/types';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';

interface TransferFormProps {
  onSuccess: () => void;
}

function walletDisplayName(w: Wallet): string {
  return [w.first_name, w.last_name].filter(Boolean).join(' ');
}

export default function TransferForm({ onSuccess }: TransferFormProps) {
  const { user } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Idempotency key: generated on first attempt, reused on retries, cleared on success.
  const pendingReference = useRef<string | null>(null);

  useEffect(() => {
    getWallets()
      .then(setWallets)
      .catch(() => {})
      .finally(() => setWalletsLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredWallets = wallets
    .filter((w) => w.user_id !== user?.id)
    .filter((w) => {
      if (!query) return true;
      return walletDisplayName(w).toLowerCase().includes(query.toLowerCase());
    });

  function handleSelect(w: Wallet) {
    setSelectedWallet(w);
    setIsOpen(false);
    setQuery('');
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError(null);
    if(!user) return

    if (!selectedWallet) {
      setError('Please select a recipient');
      return;
    }

    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError('Amount must be a positive whole number');
      return;
    }

    // Reuse existing key on retries; generate only on the first attempt.
    if (!pendingReference.current) {
      pendingReference.current = uuidv4();
    }

    setIsLoading(true);
    try {
      await transfer({
        from_account_id: user.id,
        to_account_id: selectedWallet.id,
        amount: parsed,
        reference: pendingReference.current,
      });
      // Success: discard the key so the next transfer gets a fresh one.
      pendingReference.current = null;
      setSelectedWallet(null);
      setAmount('');
      onSuccess();
    } catch (err) {
      // Keep pendingReference intact so a retry sends the same key.
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Recipient searchable dropdown */}
      <div className="w-full" ref={containerRef}>
        <label className="block text-sm text-black mb-1">Recipient</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isLoading || walletsLoading}
            className="w-full px-4 py-2 border border-gray-200 rounded text-left text-black focus:outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-400"
          >
            <span className={selectedWallet ? 'text-black' : 'text-gray-400'}>
              {walletsLoading
                ? 'Loading...'
                : selectedWallet
                ? walletDisplayName(selectedWallet)
                : 'Select recipient'}
            </span>
            <span className="float-right text-gray-400">{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-sm">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded text-black placeholder-gray-400 focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>
              <ul className="max-h-48 overflow-y-auto">
                {filteredWallets.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-gray-400">No results</li>
                ) : (
                  filteredWallets.map((w) => (
                    <li
                      key={w.id}
                      onClick={() => handleSelect(w)}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                        selectedWallet?.id === w.id ? 'bg-gray-50 font-medium' : 'text-black'
                      }`}
                    >
                      {walletDisplayName(w)}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Input
        label="Amount (₦)"
        type="number"
        min={1}
        step={1}
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isLoading}
        required
      />
      {error && <ErrorMessage message={error} />}
      <Button type="submit" isLoading={isLoading}>
        Transfer
      </Button>
    </form>
  );
}
