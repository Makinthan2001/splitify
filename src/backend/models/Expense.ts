// Expense model definition
export interface Expense {
    id: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    paidBy: string;
    paidByName?: string; // Display name for UI
    participants: string[];
    participantNames?: Record<string, string>; // Map of uid to display name
    shares?: Record<string, number>;
    splitType: "equal" | "custom" | "percentage";
    category?: string;
    proofImageUrl?: string;
    proofImagePath?: string; // Storage path for deletion
    note?: string;
    createdAt: any;
    createdAtClient?: any; // Client-side fallback timestamp
    updatedAt?: any;
    updatedAtClient?: any; // Client-side fallback timestamp
    paidAt?: any;
    paidAtClient?: any; // Client-side fallback timestamp
    location?: string;
    tags?: string[];
}

export interface ExpenseWithCalculations extends Expense {
    individualShare: number;
    userOwes: number;
    userPaid: boolean;
}

export interface ProofImage {
    id: string;
    expenseId: string;
    groupId: string;
    url: string;
    storagePath: string;
    uploadedBy: string;
    uploadedAt: any;
    fileName: string;
    size: number;
    contentType: string;
}
