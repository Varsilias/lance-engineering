'use client';

import { useState } from 'react';
import { deposit } from '@/lib/api';
import Input from '@/components/Input';
import Button from '@/components/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';

interface DepositFormProps {
  onSuccess: () => void;
}

export default function DepositForm({ onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) return;


    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError('Amount must be a positive whole number');
      return;
    }

    setIsLoading(true);
    try {
      await deposit(user.id, parsed);
      setAmount('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        Deposit
      </Button>
    </form>
  );
}
