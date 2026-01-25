// Settlement and Balance models
export interface Balance {
    uid: string;
    name?: string;
    email?: string;
    displayName?: string;
    totalPaid: number;
    totalOwes: number;
    balance: number; // positive = should receive, negative = owes
    photoURL?: string;
    expenses: string[]; // expense IDs
}

export interface Settlement {
    id: string;
    groupId: string;
    fromUser: string;
    fromUserName?: string;
    toUser: string;
    toUserName?: string;
    amount: number;
    settled: boolean;
    settledAt?: any;
    createdAt: any;
    note?: string;
    status?: "pending" | "settled";
    confirmations?: string[]; // emails or uids of users who confirmed
}

export interface GroupSummary {
    id: string;
    groupId: string;
    totalExpenses: number;
    totalAmount: number;
    balances: Balance[];
    settlements: Settlement[];
    lastUpdated: any;
    expensesByCategory?: Record<string, number>;
    expensesByMonth?: Record<string, number>;
    topSpenders?: Array<{ uid: string; name?: string; amount: number }>;
}
