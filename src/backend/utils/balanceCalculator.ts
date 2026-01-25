import { serverTimestamp } from 'firebase/firestore';
import { Balance, Settlement } from '../models/Settlement';

/**
 * Validate custom shares
 */
export const validateCustomShares = (
    shares: Record<string, number>,
    amount: number,
    participants: string[]
): { isValid: boolean; message?: string } => {
    // Check all participants have shares
    for (const uid of participants) {
        if (!(uid in shares) || shares[uid] < 0) {
            return { isValid: false, message: 'All participants must have valid share amounts' };
        }
    }

    // Check shares sum to total amount
    const totalShares = Object.values(shares).reduce((sum, share) => sum + share, 0);
    const difference = Math.abs(totalShares - amount);

    if (difference > 0.01) { // Allow for small rounding differences
        return { isValid: false, message: 'Shares must add up to the total amount' };
    }

    return { isValid: true };
};

/**
 * Calculate equal shares for participants
 */
export const calculateEqualShares = (amount: number, participants: string[]): Record<string, number> => {
    const shareAmount = Math.round((amount / participants.length) * 100) / 100;
    const shares: Record<string, number> = {};

    // Assign equal share to all participants
    participants.forEach((uid, index) => {
        shares[uid] = shareAmount;
    });

    // Adjust last participant for rounding differences
    const totalAssigned = Object.values(shares).reduce((sum, share) => sum + share, 0);
    const difference = Math.round((amount - totalAssigned) * 100) / 100;

    if (difference !== 0 && participants.length > 0) {
        const lastParticipant = participants[participants.length - 1];
        shares[lastParticipant] = Math.round((shares[lastParticipant] + difference) * 100) / 100;
    }

    return shares;
};

/**
 * Calculate percentage shares
 */
export const calculatePercentageShares = (
    amount: number,
    percentages: Record<string, number>
): Record<string, number> => {
    const shares: Record<string, number> = {};

    Object.entries(percentages).forEach(([uid, percentage]) => {
        shares[uid] = Math.round((amount * percentage / 100) * 100) / 100;
    });

    return shares;
};

/**
 * Generate optimal settlement suggestions with email consolidation
 */
export const settleBalancesWithEmailConsolidation = (balances: Balance[]): Settlement[] => {
    const settlements: Settlement[] = [];

    try {
        // Step 1: Consolidate balances by email address
        const consolidatedBalances = new Map<string, {
            email: string,
            totalBalance: number,
            totalPaid: number,
            totalOwes: number,
            displayName: string
        }>();

        balances.forEach(balance => {
            // Use email as the key, fallback to UID if no email
            const key = balance.email || balance.uid;
            const displayName = balance.name || balance.displayName || balance.email || `User ${balance.uid.substring(0, 8)}`;

            if (consolidatedBalances.has(key)) {
                // Consolidate with existing entry
                const existing = consolidatedBalances.get(key)!;
                existing.totalBalance += balance.balance;
                existing.totalPaid += balance.totalPaid;
                existing.totalOwes += balance.totalOwes;
            } else {
                // Create new entry
                consolidatedBalances.set(key, {
                    email: key,
                    totalBalance: balance.balance,
                    totalPaid: balance.totalPaid,
                    totalOwes: balance.totalOwes,
                    displayName: displayName
                });
            }
        });

        // Step 2: Separate creditors and debtors
        const creditors: Array<{ email: string, amount: number, displayName: string }> = [];
        const debtors: Array<{ email: string, amount: number, displayName: string }> = [];

        consolidatedBalances.forEach((data, email) => {
            const netBalance = Math.round(data.totalBalance * 100) / 100;

            if (netBalance > 0.01) {
                creditors.push({
                    email,
                    amount: netBalance,
                    displayName: data.displayName
                });
            } else if (netBalance < -0.01) {
                debtors.push({
                    email,
                    amount: Math.abs(netBalance),
                    displayName: data.displayName
                });
            }
        });

        // Sort for optimal matching
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        // Step 3: Generate minimal settlements
        let settlementId = 1;
        const workingCreditors = [...creditors];
        const workingDebtors = [...debtors];

        while (workingCreditors.length > 0 && workingDebtors.length > 0 && settlementId <= 20) {
            const creditor = workingCreditors[0];
            const debtor = workingDebtors[0];

            if (!creditor || !debtor || creditor.amount <= 0 || debtor.amount <= 0) break;

            const settlementAmount = Math.min(creditor.amount, debtor.amount);
            const roundedAmount = Math.round(settlementAmount * 100) / 100;

            if (roundedAmount <= 0.01) break;

            // Create a determinstic ID based on the pair
            const fromKey = debtor.email.replace(/[^\w]/g, '_');
            const toKey = creditor.email.replace(/[^\w]/g, '_');
            const deterministicId = `settlement_${fromKey}_${toKey}`;

            settlements.push({
                id: deterministicId,
                groupId: '', // Will be set by caller
                fromUser: debtor.email,
                fromUserName: debtor.displayName,
                toUser: creditor.email,
                toUserName: creditor.displayName,
                amount: roundedAmount,
                settled: false,
                confirmations: [],
                createdAt: serverTimestamp() // We'll need to handle importing serverTimestamp, or pass it in
            });

            creditor.amount = Math.round((creditor.amount - roundedAmount) * 100) / 100;
            debtor.amount = Math.round((debtor.amount - roundedAmount) * 100) / 100;

            if (creditor.amount <= 0.01) workingCreditors.shift();
            if (debtor.amount <= 0.01) workingDebtors.shift();

            settlementId++;
        }

        return settlements;
    } catch (error: any) {
        console.error('Error calculating settlements:', error);
        return [];
    }
};
