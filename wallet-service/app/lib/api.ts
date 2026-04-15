import { getToken, clearToken } from '@/lib/auth';
import type { User, AuthResponse, RegisterData, Balance, TransactionList, TransferData, Wallet } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T & { message?: string };
  status_code?: number;
}

const REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const callerSignal = options.signal;
  if (callerSignal instanceof AbortSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    clearToken();
    window.location.href = '/auth/login';
    throw new Error('Session expired');
  }

  const json: ApiResponse<T & { message?: string }> = await response.json();

  if (!response.ok || !json.status) {
    const errorMessage = json.data?.message || json.message || 'An error occurred';
    throw new Error(errorMessage);
  }

  return json.data as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(signal?: AbortSignal): Promise<User> {
  return request<User>('/auth/me', { signal });
}

export async function getBalance(userId: string): Promise<Balance> {
  return request<Balance>(`/wallet/${userId}/balance`);
}

export async function getTransactions(userId: string): Promise<TransactionList> {
  return request<TransactionList>(`/wallet/${userId}/transactions`);
}

export async function deposit(userId: string, amount: number): Promise<{ id: string; amount: number }> {
  return request<{ id: string; amount: number }>('/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount }),
  });
}

export async function getWallets(): Promise<Wallet[]> {
  return request<Wallet[]>('/wallet/list');
}

export async function transfer(data: TransferData): Promise<{ id: string; amount: number }> {
  return request<{ id: string; amount: number }>('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
