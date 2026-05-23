import { forgerockService } from './forgerock';

const BASE_URL = 'https://cbonline.lloyds.com:3000';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  employeeNumber: string;
  lastLogin: string;
  sessionStarted: string;
}

export interface Account {
  accountId: string;
  accountNumber: string;
  sortCode: string;
  type: string;
  name: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  creditLimit?: number;
  interestRate?: number;
  overdraftLimit?: number;
}

export interface AccountListResponse {
  accounts: Account[];
  totalBalance: number;
  currency: string;
}

export interface Transaction {
  transactionId: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  currency: string;
  balance: number;
  status: string;
  reference: string;
  paymentMethod: string;
}

export interface TransactionListResponse {
  accountId: string;
  transactions: Transaction[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface TransactionSummary {
  accountId: string;
  accountName: string;
  totalCredits: number;
  totalDebits: number;
  netMovement: number;
  transactionCount: number;
  currency: string;
}

export interface TransactionSummaryResponse {
  period: string;
  summary: TransactionSummary[];
  overall: {
    totalCredits: number;
    totalDebits: number;
    netMovement: number;
    currency: string;
  };
}

export interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface Approval {
  approvalId: string;
  description: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: string;
  paymentMethod: string;
  dueDate: string;
  status: string;
  urgency: string;
}

export interface ApprovalListResponse {
  approvals: Approval[];
  totalCount: number;
  totalValue: number;
  currency: string;
}

export interface ApprovalResponse {
  approvalId: string;
  status: string;
  message: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  reason?: string;
}

export interface TransactionParams {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  type?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchUserProfile(headers: Record<string, string>): Promise<UserProfile> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/user/me`, {
    credentials: 'include',
    headers: { ...authHeaders, ...headers },
  });
  return handleResponse<UserProfile>(res);
}

export async function fetchAccounts(): Promise<AccountListResponse> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/accounts`, {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<AccountListResponse>(res);
}

export async function fetchAccount(accountId: string): Promise<Account> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/accounts/${accountId}`, {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<Account>(res);
}

export async function fetchTransactions(
  accountId: string,
  params?: TransactionParams,
): Promise<TransactionListResponse> {
  const url = new URL(`${BASE_URL}/api/accounts/${accountId}/transactions`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<TransactionListResponse>(res);
}

export async function fetchTransactionSummary(period?: string): Promise<TransactionSummaryResponse> {
  const url = new URL(`${BASE_URL}/api/transactions/summary`);
  if (period) url.searchParams.set('period', period);
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<TransactionSummaryResponse>(res);
}

export async function fetchNotifications(
  params?: { read?: boolean; type?: string },
): Promise<NotificationListResponse> {
  const url = new URL(`${BASE_URL}/api/notifications`);
  if (params) {
    if (params.read !== undefined) url.searchParams.set('read', String(params.read));
    if (params.type) url.searchParams.set('type', params.type);
  }
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<NotificationListResponse>(res);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'PUT',
    credentials: 'include',
    headers: authHeaders,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchApprovals(): Promise<ApprovalListResponse> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/approvals`, {
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<ApprovalListResponse>(res);
}

export async function approvePayment(approvalId: string): Promise<ApprovalResponse> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/approvals/${approvalId}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders,
  });
  return handleResponse<ApprovalResponse>(res);
}

export async function rejectPayment(approvalId: string, reason: string): Promise<ApprovalResponse> {
  const authHeaders = await forgerockService.getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/approvals/${approvalId}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return handleResponse<ApprovalResponse>(res);
}
