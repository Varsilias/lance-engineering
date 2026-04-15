export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'TRANSFER';
  amount: number;
  reference: string;
  description?: string;
  created_at: string;
}

export interface Balance {
  balance_kobo: number;
  balance_naira: number;
}

export interface TransactionList {
  items: Transaction[];
  has_next: boolean;
  next_cursor: string | null;
}

export interface Wallet {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface TransferData {
  from_account_id: string
  to_account_id: string;
  amount: number;
  reference: string;
}
