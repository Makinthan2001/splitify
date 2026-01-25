import { Expense } from '../models/Expense';
import { Balance, GroupSummary, Settlement } from '../models/Settlement';
import {
    addExpense as addExpenseService,
    calculateGroupSummary as calculateGroupSummaryService,
    confirmSettlement as confirmSettlementService,
    deleteExpense as deleteExpenseService,
    getExpense as getExpenseService,
    getGroupExpenses as getGroupExpensesService,
    getGroupSummary as getGroupSummaryService,
    updateExpense as updateExpenseService
} from '../services/ExpenseService';

export const addExpense = async (groupId: string, expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<string> => {
    return await addExpenseService(groupId, expenseData);
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
    return await getGroupExpensesService(groupId);
};

export const getExpense = async (groupId: string, expenseId: string): Promise<Expense | null> => {
    return await getExpenseService(groupId, expenseId);
};

export const updateExpense = async (groupId: string, expenseId: string, updates: Partial<Expense>): Promise<void> => {
    return await updateExpenseService(groupId, expenseId, updates);
};

export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
    return await deleteExpenseService(groupId, expenseId);
};

export const getGroupSummary = async (groupId: string): Promise<GroupSummary> => {
    return await getGroupSummaryService(groupId);
};

export const calculateGroupSummary = async (groupId: string): Promise<{ balances: Balance[]; settlements: Settlement[]; }> => {
    return await calculateGroupSummaryService(groupId);
};

export const confirmSettlement = async (
    groupId: string,
    fromUserUid: string,
    toUserUid: string,
    amount: number,
    confirmingUserEmail: string,
    options: { id?: string }
): Promise<void> => {
    return await confirmSettlementService(groupId, fromUserUid, toUserUid, amount, confirmingUserEmail, options);
};
