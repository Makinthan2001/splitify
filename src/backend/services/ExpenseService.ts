import { arrayUnion } from 'firebase/firestore';
import {
    addExpenseDoc,
    deleteExpenseDoc,
    getExpenseDoc,
    getExpensesForGroup,
    saveGroupSummary,
    updateExpenseDoc
} from '../dao/ExpenseDao';
import {
    getSettlementDoc,
    setSettlementDoc,
    updateSettlementDoc
} from '../dao/SettlementDao';
import {
    calculateEqualShares
} from '../utils/balanceCalculator';


import { serverTimestamp } from 'firebase/firestore';
import { getSettledSettlements } from '../dao/SettlementDao';
import { getUserDocument, getUserDocumentByEmail } from '../dao/UserDao';
import { Expense } from '../models/Expense';
import { Balance, GroupSummary, Settlement } from '../models/Settlement';
import { settleBalancesWithEmailConsolidation } from '../utils/balanceCalculator';

/**
 * Clean undefined fields helper
 */
const cleanUndefinedFields = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(cleanUndefinedFields).filter(item => item !== undefined);
    }
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = cleanUndefinedFields(value);
        }
    }
    return cleaned;
};

export const addExpense = async (
    groupId: string,
    expenseData: Omit<Expense, 'id' | 'createdAt'>
): Promise<string> => {
    try {
        const expense: Omit<Expense, 'id'> = {
            ...expenseData,
            createdAt: serverTimestamp(),
            createdAtClient: Date.now(),
            updatedAt: serverTimestamp(),
            updatedAtClient: Date.now(),
            paidAt: expenseData.paidAt || serverTimestamp(),
            paidAtClient: Date.now(),
        };

        if (!expense.shares && expense.splitType === 'equal') {
            expense.shares = calculateEqualShares(expense.amount, expense.participants);
        }

        const cleanedExpense = cleanUndefinedFields(expense);
        const id = await addExpenseDoc(groupId, cleanedExpense);

        await invalidateGroupSummary(groupId);
        return id;
    } catch (error: any) {
        throw new Error(`Failed to add expense service: ${error.message}`);
    }
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
    try {
        const expenses = await getExpensesForGroup(groupId);
        // Normalize dates if needed (omitted for brevity, assuming UI handles it or models match)
        return expenses;
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to access this group\'s expenses.');
        }
        throw new Error(`Failed to get expenses service: ${error.message}`);
    }
};

export const getExpense = async (groupId: string, expenseId: string): Promise<Expense | null> => {
    try {
        return await getExpenseDoc(groupId, expenseId);
    } catch (error: any) {
        throw new Error(`Failed to get expense service: ${error.message}`);
    }
};

export const updateExpense = async (
    groupId: string,
    expenseId: string,
    updates: Partial<Expense>
): Promise<void> => {
    try {
        const serverUpdates = {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedAtClient: Date.now()
        };
        const cleanedUpdates = cleanUndefinedFields(serverUpdates);
        await updateExpenseDoc(groupId, expenseId, cleanedUpdates);
    } catch (error: any) {
        throw new Error(`Failed to update expense service: ${error.message}`);
    }
};

export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
    try {
        await deleteExpenseDoc(groupId, expenseId);
    } catch (error: any) {
        throw new Error(`Failed to delete expense service: ${error.message}`);
    }
};

export const calculateGroupSummary = async (groupId: string): Promise<{
    balances: Balance[];
    settlements: Settlement[];
}> => {
    try {
        const expenses = await getGroupExpenses(groupId);
        const totalPaid: Record<string, number> = {};
        const totalOwed: Record<string, number> = {};

        expenses.forEach((expense) => {
            if (!totalPaid[expense.paidBy]) totalPaid[expense.paidBy] = 0;
            totalPaid[expense.paidBy] += expense.amount;

            if (expense.shares) {
                Object.entries(expense.shares).forEach(([uid, share]: [string, number]) => {
                    if (!totalOwed[uid]) totalOwed[uid] = 0;
                    totalOwed[uid] += share;
                });
            }
        });

        const allMembers = new Set([
            ...Object.keys(totalPaid),
            ...Object.keys(totalOwed)
        ]);

        // Fetch users
        const userDataPromises = Array.from(allMembers).map(async (uid) => {
            try {
                const isEmailUid = uid && uid.includes('@') && uid.includes('.');
                return isEmailUid ? await getUserDocumentByEmail(uid) : await getUserDocument(uid);
            } catch { return null; }
        });
        const userData = await Promise.all(userDataPromises);
        const userMap = new Map();
        userData.forEach((user, index) => {
            const uid = Array.from(allMembers)[index];
            userMap.set(uid, user);
        });

        const balances: Balance[] = [];
        allMembers.forEach(uid => {
            const paid = totalPaid[uid] || 0;
            const owed = totalOwed[uid] || 0;
            const balance = Math.round((paid - owed) * 100) / 100;
            const userExpenses = expenses
                .filter(exp => exp.paidBy === uid || (exp.shares && exp.shares[uid] > 0))
                .map(exp => exp.id);
            const user = userMap.get(uid);

            // Prefer real name first, then email
            const isEmailUid = uid && uid.includes('@') && uid.includes('.');
            let displayEmail = '';
            let displayName = '';

            if (user?.name && !user.name.startsWith('User ')) {
                displayName = user.name;
                displayEmail = user?.email || (isEmailUid ? uid : '');
            } else if (user?.email) {
                displayEmail = user.email;
                displayName = user.email;
            } else if (isEmailUid) {
                displayEmail = uid;
                displayName = uid;
            } else {
                displayName = `User ${uid.substring(0, 8)} (Missing Profile)`;
                displayEmail = '';
            }

            balances.push({
                uid,
                name: displayName,
                email: displayEmail,
                displayName: displayName,
                totalPaid: paid,
                totalOwes: owed,
                balance,
                expenses: userExpenses
            });
        });

        // Apply settlements
        try {
            const settledList = await getSettledSettlements(groupId);
            const norm = (s: string) => (s || '').toLowerCase();
            settledList.forEach(s => {
                const fromId = norm(s.fromUser || '');
                const toId = norm(s.toUser || '');
                const amount = Number(s.amount) || 0;
                if (!amount) return;
                const findIndex = (ident: string) =>
                    balances.findIndex(b => norm(b.email || '') === ident || norm(b.uid || '') === ident);
                const fromIdx = findIndex(fromId);
                const toIdx = findIndex(toId);
                if (fromIdx >= 0) balances[fromIdx].balance = Math.round((balances[fromIdx].balance + amount) * 100) / 100;
                if (toIdx >= 0) balances[toIdx].balance = Math.round((balances[toIdx].balance - amount) * 100) / 100;
            });
        } catch { /* ignore */ }

        // Dedupe balances
        const dedupeBalancesByIdentity = (items: Balance[]): Balance[] => {
            const map = new Map<string, Balance>();
            const norm = (s: string | undefined) => (s || '').toLowerCase();
            items.forEach((b) => {
                const key = norm(b.email) || norm(b.uid);
                if (!key) return;
                if (!map.has(key)) {
                    map.set(key, { ...b });
                } else {
                    const existing = map.get(key)!;
                    existing.totalPaid = Math.round((existing.totalPaid + b.totalPaid) * 100) / 100;
                    existing.totalOwes = Math.round((existing.totalOwes + b.totalOwes) * 100) / 100;
                    existing.balance = Math.round((existing.balance + b.balance) * 100) / 100;
                    if (!existing.name && b.name) existing.name = b.name;
                    if (!existing.displayName && b.displayName) existing.displayName = b.displayName;
                    if (!existing.email && b.email) existing.email = b.email;
                    const set = new Set(existing.expenses || []);
                    (b.expenses || []).forEach((id) => set.add(id));
                    existing.expenses = Array.from(set);
                }
            });
            return Array.from(map.values());
        };

        const dedupedBalances = dedupeBalancesByIdentity(balances);
        const settlements = settleBalancesWithEmailConsolidation(dedupedBalances);

        settlements.forEach((settlement: Settlement) => {
            settlement.groupId = groupId;
        });

        // Hydrate settlements with existing confirmations from DB
        // Since we use deterministic IDs, we can check if a pending settlement exists
        const hydratedSettlements = await Promise.all(settlements.map(async (s) => {
            try {
                const existing = await getSettlementDoc(groupId, s.id);
                // Fix: If existing settlement is already settled, but the calculator says we have a balance (s exists),
                // then the "settled" status is stale (from a previous debt). Treat it as a new pending settlement.
                if (existing && !existing.settled && existing.status !== 'settled') {
                    return {
                        ...s,
                        confirmations: existing.confirmations || [],
                        settled: existing.settled || false,
                        status: existing.status
                    };
                }
                return s;
            } catch (e) {
                return s;
            }
        }));

        return { balances: dedupedBalances, settlements: hydratedSettlements };
    } catch (error: any) {
        throw new Error(`Failed to calculate group summary service: ${error.message}`);
    }
};

export const getGroupSummary = async (groupId: string): Promise<GroupSummary> => {
    try {
        const { balances, settlements } = await calculateGroupSummary(groupId);
        // We can fetch cached summary if calculation fails or takes too long, 
        // but for now keeping it simple as per original logic's core intent (calculate then cache)

        // Re-fetch expenses for stats
        const expenses = await getGroupExpenses(groupId);

        const totalExpenses = expenses.length || 0;
        const totalAmount = expenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);

        const expensesByCategory: Record<string, number> = {};
        expenses.forEach(exp => {
            const category = exp.category || 'Others';
            expensesByCategory[category] = (expensesByCategory[category] || 0) + exp.amount;
        });

        const expensesByMonth: Record<string, number> = {};
        // Date parsing omitted for brevity

        const cleanSummary = {
            id: groupId || '',
            groupId: groupId || '',
            totalExpenses,
            totalAmount,
            balances,
            settlements: settlements || [], // We should merge with persisted settlements status logic if needed
            lastUpdated: serverTimestamp(),
            expensesByCategory,
            expensesByMonth,
            topSpenders: balances
                .sort((a, b) => b.totalPaid - a.totalPaid)
                .slice(0, 3)
                .map(b => ({
                    uid: b.uid,
                    name: b.name || b.displayName || b.email || `User ${b.uid.substring(0, 5)}`,
                    amount: b.totalPaid,
                    photoURL: undefined // Or fetch if available in balance
                }))
        };

        const comprehensiveSummary = cleanUndefinedFields(cleanSummary);
        await saveGroupSummary(groupId, comprehensiveSummary);

        return comprehensiveSummary as GroupSummary;
    } catch (error: any) {
        throw new Error(`Failed to get group summary service: ${error.message}`);
    }
};

export const invalidateGroupSummary = async (groupId: string): Promise<void> => {
    try {
        await saveGroupSummary(groupId, { lastUpdated: serverTimestamp() });
    } catch (error) { }
};
export const confirmSettlement = async (
    groupId: string,
    fromUserUid: string,
    toUserUid: string,
    amount: number,
    confirmingUserEmail: string,
    options: { id?: string }
): Promise<void> => {
    try {
        if (!options.id) throw new Error("Settlement ID is required for confirmation");

        // Check availability first
        let settlement = await getSettlementDoc(groupId, options.id);

        // Fix: If the settlement exists but is marked as settled, it's a stale record 
        // for a new debt. We must reset it.
        if (!settlement || settlement.settled || settlement.status === "settled") {
            // It's a fresh settlement (or stale one being reset)
            if (settlement && (settlement.settled || settlement.status === "settled")) {
                const archiveId = `${settlement.id}_${Date.now()}`;
                const archivedSettlement = { ...settlement, id: archiveId };
                await setSettlementDoc(groupId, archivedSettlement);
            }

            settlement = {
                id: options.id,
                groupId,
                fromUser: fromUserUid,
                toUser: toUserUid,
                amount: amount,
                settled: false, // Reset settled status
                status: 'pending',
                confirmations: [], // Clear old confirmations
                createdAt: serverTimestamp() as any,
                lastUpdated: serverTimestamp() as any
            } as Settlement;

            // Create or Overwrite the doc
            await setSettlementDoc(groupId, settlement);
        }

        // 1. Add confirmation (if not already there)
        const currentConfirmations = (settlement.confirmations || []).map(c => c.toLowerCase());
        const confirmEmailLower = confirmingUserEmail.toLowerCase();

        if (!currentConfirmations.includes(confirmEmailLower)) {
            const updates = {
                confirmations: arrayUnion(confirmEmailLower),
                lastUpdated: serverTimestamp()
            };
            await updateSettlementDoc(groupId, options.id, updates as any);

            // Refetch to get latest state for checking settled status
            const updated = await getSettlementDoc(groupId, options.id);
            if (updated) settlement = updated;
        }

        // 2. Check if settled
        const latestSettlement = await getSettlementDoc(groupId, options.id);
        if (!latestSettlement) return;

        const confirmations = (latestSettlement.confirmations || []).map(e => e.toLowerCase());

        // We need emails of both users to verify fully confirmed
        // Assuming fromUserUid and toUserUid passed in are correct, but valid check needs emails
        // Helper to get email from uid is tricky without looking up users. 
        // But simply, if confirmations count >= 2, likely both confirmed. 
        // OR better: check if both involved parties have confirmed.

        // Let's resolve the involved emails
        const fromUser = await getUserDocument(fromUserUid); // or by email if stored as email
        const toUser = await getUserDocument(toUserUid);

        const fromEmail = (fromUser?.email || fromUserUid).toLowerCase();
        const toEmail = (toUser?.email || toUserUid).toLowerCase();

        if (confirmations.includes(fromEmail) && confirmations.includes(toEmail)) {
            await updateSettlementDoc(groupId, options.id, {
                settled: true,
                status: 'settled',
                settledAt: serverTimestamp()
            } as any);
            await invalidateGroupSummary(groupId);
        }

    } catch (error: any) {
        throw new Error(`Failed to confirm settlement service: ${error.message}`);
    }
};
