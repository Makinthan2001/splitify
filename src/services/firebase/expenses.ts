// Firestore expenses service
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { Balance, Expense, GroupSummary, Settlement } from '../../types';
import { db } from './config';
import { getUserDocument, getUserDocumentByEmail } from './users';

/**
 * Recursively clean undefined fields from an object
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

/**
 * Add expense to group with optional proof image
 */
export const addExpense = async (
  groupId: string,
  expenseData: Omit<Expense, 'id' | 'createdAt'>
): Promise<string> => {
  

  try {
    const expense: Omit<Expense, 'id'> = {
      ...expenseData,
      createdAt: serverTimestamp(),
      // Client-side fallback for immediate display until serverTimestamp resolves
      createdAtClient: Date.now(),
      updatedAt: serverTimestamp(),
      updatedAtClient: Date.now(),
      paidAt: expenseData.paidAt || serverTimestamp(),
      paidAtClient: Date.now(),
    };

    // Photo proof removed

    // Calculate shares if not provided
    if (!expense.shares && expense.splitType === 'equal') {
      expense.shares = calculateEqualShares(expense.amount, expense.participants);
    }

    
    // Clean any undefined fields (Firestore doesn't accept undefined)
    const cleanedExpense = cleanUndefinedFields(expense);

    // Use the structure you created: expenses/{groupId}/expenses/{expenseId}
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const docRef = await addDoc(expensesRef, cleanedExpense);

    

    // Invalidate group summary cache
    await invalidateGroupSummary(groupId);

    return docRef.id;
  } catch (error: any) {
    
    throw new Error(`Failed to add expense: ${error.message}`);
  }
};

/**
 * Get expenses for a group
 */
export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    
    // Add aggressive timeout protection
    const queryPromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000)
    );
    
    const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
    const normalizeDateField = (v: any): any => {
      try {
        if (!v) return undefined;
        if (typeof v?.toDate === 'function') return v; // Firestore Timestamp
        if (v instanceof Date) return v;
        // If unresolved serverTimestamp sentinel, leave undefined and let UI fallback
        if (typeof v === 'object' && v._methodName === 'serverTimestamp') {
          return undefined;
        }
        const d = new Date(v as any);
        return isNaN(d.getTime()) ? undefined : d;
      } catch {
        return undefined;
      }
    };

    const expenses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const exp = {
        id: doc.id,
        ...data,
      } as any;
      // Normalize timestamp-like fields for UI safety
      exp.createdAt = normalizeDateField((data as any).createdAt) ?? (data as any).createdAt;
      exp.updatedAt = normalizeDateField((data as any).updatedAt) ?? (data as any).updatedAt;
      exp.paidAt = normalizeDateField((data as any).paidAt) ?? (data as any).paidAt;
      return exp as Expense;
    });
    
    
    return expenses;
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.code === 'permission-denied') {
      
      throw new Error('You do not have permission to access this group\'s expenses.');
    } else {
      
      throw new Error(`Failed to get expenses: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Get single expense
 */
export const getExpense = async (groupId: string, expenseId: string): Promise<Expense | null> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const docRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Expense;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get expense: ${error.message}`);
  }
};

/**
 * Update expense
 */
export const updateExpense = async (
  groupId: string, 
  expenseId: string, 
  updates: Partial<Expense>
): Promise<void> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    // Clean undefined fields from updates before sending to Firestore
    const serverUpdates = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedAtClient: Date.now()
    };
    const cleanedUpdates = cleanUndefinedFields(serverUpdates);
    await updateDoc(expenseRef, cleanedUpdates);
  } catch (error: any) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }
};

/**
 * Delete expense
 */
export const deleteExpense = async (groupId: string, expenseId: string): Promise<void> => {
  try {
    // Use your database structure: expenses/{groupId}/expenses/{expenseId}
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (error: any) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
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
 * Calculate group balance summary with proper user consolidation
 */
export const calculateGroupSummary = async (groupId: string): Promise<{
  balances: Balance[];
  settlements: Settlement[];
}> => {
  try {
    const expenses = await getGroupExpenses(groupId);
    
    
    // Calculate total paid and total owed for each member
    const totalPaid: Record<string, number> = {};
    const totalOwed: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      
      
      // Add to total paid
      if (!totalPaid[expense.paidBy]) totalPaid[expense.paidBy] = 0;
      totalPaid[expense.paidBy] += expense.amount;
      
      // Add to total owed (shares)
      if (expense.shares) {
        
        Object.entries(expense.shares).forEach(([uid, share]: [string, number]) => {
          if (!totalOwed[uid]) totalOwed[uid] = 0;
          totalOwed[uid] += share;
        });
      } else {
        
      }
    });
    
    
    
    // Get all unique UIDs
    const allMembers = new Set([
      ...Object.keys(totalPaid),
      ...Object.keys(totalOwed)
    ]);
    
    // Fetch user data for all members with timeout protection
    const userDataPromises = Array.from(allMembers).map(async (uid) => {
      try {
        const isEmailUid = uid && uid.includes('@') && uid.includes('.');
        const userPromise = isEmailUid ? getUserDocumentByEmail(uid) : getUserDocument(uid);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error(`User fetch timeout for ${uid}`)), 2000)
        );
        
        const user = await Promise.race([userPromise, timeoutPromise]);
        
        return user;
      } catch (error) {
        
        return null;
      }
    });
    const userData = await Promise.all(userDataPromises);
    const userMap = new Map();
    userData.forEach((user, index) => {
      const uid = Array.from(allMembers)[index];
      userMap.set(uid, user);
    });
    
    // Create balances for each UID (maintaining original structure for compatibility)
    const balances: Balance[] = [];
    
    allMembers.forEach(uid => {
      const paid = totalPaid[uid] || 0;
      const owed = totalOwed[uid] || 0;
      const balance = Math.round((paid - owed) * 100) / 100;
      const userExpenses = expenses.filter(exp => exp.paidBy === uid || (exp.shares && exp.shares[uid] > 0)).map(exp => exp.id);
      const user = userMap.get(uid);
      
      
      
      // Prefer real name first, then email; avoid duplicating email
      const isEmailUid = uid && uid.includes('@') && uid.includes('.');
      let displayEmail = '';
      let displayName = '';

      if (user?.name && !user.name.startsWith('User ')) {
        // Name set in profile/doc
        displayName = user.name;
        displayEmail = user?.email || (isEmailUid ? uid : '');
      } else if (user?.email) {
        // No name, show full email everywhere for consistency
        displayEmail = user.email;
        displayName = user.email; // Use full email, not local-part
      } else if (isEmailUid) {
        // UID is actually an email; use full email as display
        displayEmail = uid;
        displayName = uid;
      } else {
        // Fallback
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
    
    // Apply already settled transfers to balances to reflect real net
    try {
      const settledColl = collection(db, 'settlements', groupId, 'settlements');
      const settledQ = query(settledColl, where('settled', '==', true));
      const settledSnap = await getDocs(settledQ);
      const settledList = settledSnap.docs.map(d => d.data()) as any[];
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
    } catch { /* ignore adjustments on failure */ }

    // Deduplicate balances by email (fallback to UID) to avoid duplicates in UI
    const dedupeBalancesByIdentity = (items: Balance[]): Balance[] => {
      const map = new Map<string, Balance>();
      const norm = (s: string | undefined) => (s || '').toLowerCase();
      items.forEach((b) => {
        const key = norm(b.email) || norm(b.uid);
        if (!key) return;
        if (!map.has(key)) {
          // Clone to avoid mutating original
          map.set(key, {
            uid: b.uid,
            name: b.name,
            email: b.email,
            displayName: b.displayName,
            totalPaid: b.totalPaid,
            totalOwes: b.totalOwes,
            balance: b.balance,
            expenses: Array.isArray(b.expenses) ? [...b.expenses] : [],
            photoURL: (b as any).photoURL,
          } as Balance);
        } else {
          const existing = map.get(key)!;
          existing.totalPaid = Math.round((existing.totalPaid + b.totalPaid) * 100) / 100;
          existing.totalOwes = Math.round((existing.totalOwes + b.totalOwes) * 100) / 100;
          existing.balance = Math.round((existing.balance + b.balance) * 100) / 100;
          // Prefer real name/email if missing
          if (!existing.name && b.name) existing.name = b.name;
          if (!existing.displayName && b.displayName) existing.displayName = b.displayName;
          if (!existing.email && b.email) existing.email = b.email;
          // Merge expenses
          const set = new Set(existing.expenses || []);
          (b.expenses || []).forEach((id) => set.add(id));
          existing.expenses = Array.from(set);
        }
      });
      return Array.from(map.values());
    };

    const dedupedBalances = dedupeBalancesByIdentity(balances);

    // Generate settlement suggestions with email consolidation
    const settlements = settleBalancesWithEmailConsolidation(dedupedBalances);
    
    
    
    // Set groupId for settlements
    settlements.forEach((settlement: Settlement) => {
      settlement.groupId = groupId;
    });
    
    return { balances: dedupedBalances, settlements };
  } catch (error: any) {
    
    throw new Error(`Failed to calculate group summary: ${error.message}`);
  }
};

/**
 * Generate optimal settlement suggestions with email consolidation
 * This algorithm consolidates duplicate users by email and calculates net settlements
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
    const creditors: Array<{email: string, amount: number, displayName: string}> = [];
    const debtors: Array<{email: string, amount: number, displayName: string}> = [];
    
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
    
    
    
    // Step 3: Generate minimal settlements with safety checks
    let settlementId = 1;
    const workingCreditors = [...creditors];
    const workingDebtors = [...debtors];
    
    while (workingCreditors.length > 0 && workingDebtors.length > 0 && settlementId <= 20) {
      const creditor = workingCreditors[0];
      const debtor = workingDebtors[0];
      
      // Safety check for valid amounts
      if (!creditor || !debtor || creditor.amount <= 0 || debtor.amount <= 0) {
        
        break;
      }
      
      const settlementAmount = Math.min(creditor.amount, debtor.amount);
      const roundedAmount = Math.round(settlementAmount * 100) / 100;
      
      if (roundedAmount <= 0.01) {
        
        break;
      }
      
      
      
      settlements.push({
        id: `consolidated-settlement-${settlementId}-${Date.now()}`,
        groupId: '', // Will be set by caller
        fromUser: debtor.email,
        fromUserName: debtor.displayName,
        toUser: creditor.email,
        toUserName: creditor.displayName,
        amount: roundedAmount,
        settled: false,
        createdAt: serverTimestamp()
      });
      
      // Update amounts
      creditor.amount = Math.round((creditor.amount - roundedAmount) * 100) / 100;
      debtor.amount = Math.round((debtor.amount - roundedAmount) * 100) / 100;
      
      // Remove settled parties
      if (creditor.amount <= 0.01) {
        workingCreditors.shift();
      }
      if (debtor.amount <= 0.01) {
        workingDebtors.shift();
      }
      
      settlementId++;
    }
    
    if (settlementId > 20) {
      
    }
    
    
    
    return settlements;
    
  } catch (error: any) {
    
    return []; // Return empty array if calculation fails
  }
};

/**
 * Delete expense with proof image cleanup
 */
// deleteExpenseWithCleanup removed (photo proof not supported)

/**
 * Update expense with proof image support
 */
// updateExpenseWithProof removed (photo proof not supported)

/**
 * Get comprehensive group summary with caching
 */
/**
 * Calculate group summary with timeout protection and fallbacks
 */
const calculateGroupSummaryWithTimeout = async (groupId: string): Promise<{
  summary: { balances: Balance[]; settlements: Settlement[] };
  expenses: Expense[];
}> => {
  
  
  try {
    // Try to invalidate cache (don't fail if this doesn't work)
    try {
      await invalidateGroupSummary(groupId);
    } catch (cacheError) {
      
    }
    
    // Get expenses with aggressive timeout
    let expenses: Expense[] = [];
    try {
      expenses = await getGroupExpenses(groupId);
      
    } catch (expenseError) {
      
      expenses = []; // Continue with empty expenses if needed
    }
    
    // Calculate summary with fallback
    let summary: { balances: Balance[]; settlements: Settlement[] };
    try {
      summary = await calculateGroupSummary(groupId);
      
    } catch (summaryError) {
      
      // Return minimal empty summary
      summary = {
        balances: [],
        settlements: []
      };
    }
    
    return { summary, expenses };
    
  } catch (error: any) {
    
    // Return absolute fallback
    return {
      summary: { balances: [], settlements: [] },
      expenses: []
    };
  }
};

/**
 * Get comprehensive group summary with caching
 */
export const getGroupSummary = async (groupId: string): Promise<GroupSummary> => {
  
  
  try {
    // Add timeout protection for the entire summary calculation
    const summaryPromise = calculateGroupSummaryWithTimeout(groupId);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Group summary calculation timed out after 12 seconds')), 12000)
    );
    
    const { summary, expenses } = await Promise.race([summaryPromise, timeoutPromise]);
    
    
    
    // Enhance with additional metrics
    const totalExpenses = expenses.length || 0;
    const totalAmount = expenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(exp => {
      const category = exp.category || 'Others';
      const amount = exp.amount || 0;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });
    
    // Group expenses by month - only process expenses with valid dates
    const expensesByMonth: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.createdAt && typeof exp.createdAt.toDate === 'function') {
        try {
          const date = exp.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const amount = exp.amount || 0;
          expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + amount;
        } catch (error) {
          
        }
      }
    });
    
    // Calculate top spenders
    const spenderTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      if (exp.paidBy && exp.amount) {
        spenderTotals[exp.paidBy] = (spenderTotals[exp.paidBy] || 0) + exp.amount;
      }
    });
    
    const topSpenders = Object.entries(spenderTotals)
      .map(([uid, amount]) => {
        const userBalance = summary.balances.find(b => b.uid === uid);
        const isEmailUid = uid && uid.includes('@') && uid.includes('.');

        // Prefer human name first, then email, then fallbacks
        let displayName = '';
        let emailForSpender: string | undefined = undefined;
        if (userBalance?.name && !userBalance.name.startsWith('User ')) {
          displayName = userBalance.name;
          emailForSpender = userBalance.email;
        } else if (userBalance?.displayName && !userBalance.displayName.startsWith('User ')) {
          displayName = userBalance.displayName;
          emailForSpender = userBalance.email;
        } else if (userBalance?.email) {
          displayName = userBalance.name || userBalance.displayName || userBalance.email;
          emailForSpender = userBalance.email;
        } else if (isEmailUid) {
          displayName = uid;
          emailForSpender = uid;
        } else {
          const expenseWithName = expenses.find(e => e.paidBy === uid && e.paidByName);
          displayName = expenseWithName?.paidByName || `User ${uid.substring(0, 8)} (Missing Profile)`;
        }

        return {
          uid: uid || '',
          amount: amount || 0,
          name: displayName,
          email: emailForSpender
        } as any;
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    // Merge settlement suggestions with persisted statuses
    const enrichedSettlements = await mergeSettlementStatuses(groupId, summary.settlements || []);

    // Create summary with guaranteed no undefined values
    const cleanSummary = {
      id: groupId || '',
      groupId: groupId || '',
      totalExpenses: totalExpenses,
      totalAmount: totalAmount,
      balances: summary.balances || [],
      settlements: enrichedSettlements || [],
      lastUpdated: serverTimestamp(),
      expensesByCategory: expensesByCategory,
      expensesByMonth: expensesByMonth,
      topSpenders: topSpenders,
    };
    
    // Double-check: recursively clean any undefined values
    const comprehensiveSummary = cleanUndefinedFields(cleanSummary);
    
    // Cache the summary using setDoc to handle creation/update
    const summaryRef = doc(db, 'groupSummaries', groupId);
    await setDoc(summaryRef, comprehensiveSummary, { merge: true });
    
    
    return comprehensiveSummary as GroupSummary;
    
  } catch (error: any) {
    
    throw new Error(`Failed to get group summary: ${error.message}`);
  }
};

/**
 * Invalidate group summary cache
 */
export const invalidateGroupSummary = async (groupId: string): Promise<void> => {
  try {
    const summaryRef = doc(db, 'groupSummaries', groupId);
    await setDoc(summaryRef, { 
      lastUpdated: serverTimestamp() // Update with current time
    }, { merge: true });
  } catch (error) {
    // If there's an error, log it but don't throw
    
  }
};

/**
 * Get expenses with user details
 */
export const getGroupExpensesWithDetails = async (groupId: string): Promise<Expense[]> => {
  
  
  try {
    const expenses = await getGroupExpenses(groupId);
    
    // For now, return expenses as-is
    // In a real app, you'd fetch user details to populate paidByName and participantNames
    return expenses;
    
  } catch (error: any) {
    
    throw new Error(`Failed to get detailed expenses: ${error.message}`);
  }
};

/**
 * Get expenses by category
 */
export const getExpensesByCategory = async (
  groupId: string, 
  category: string
): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(
      expensesRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    return expenses;
  } catch (error: any) {
    throw new Error(`Failed to get expenses by category: ${error.message}`);
  }
};

/**
 * Get expenses by date range
 */
export const getExpensesByDateRange = async (
  groupId: string,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  try {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(
      expensesRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    
    return expenses;
  } catch (error: any) {
    throw new Error(`Failed to get expenses by date range: ${error.message}`);
  }
};

/**
 * Settlement persistence helpers
 */
const settlementIdFor = (
  groupId: string,
  from: string,
  to: string,
  amount: number,
  version?: number
): string => {
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cents = Math.round((amount || 0) * 100);
  const v = typeof version === 'number' && isFinite(version) ? version : 0;
  return `${groupId}__v${v}__${norm(from)}__${norm(to)}__${cents}`;
};

const mergeSettlementStatuses = async (
  groupId: string,
  suggestions: Settlement[],
  version?: number
): Promise<Settlement[]> => {
  try {
    const coll = collection(db, 'settlements', groupId, 'settlements');
    const snap = await getDocs(coll);
    const existing = new Map<string, any>();
    snap.forEach(d => existing.set(d.id, { id: d.id, ...d.data() }));

    const results: Settlement[] = [];
    for (const s of suggestions) {
      const id = settlementIdFor(groupId, s.fromUser, s.toUser, s.amount, version);
      const persisted = existing.get(id);
      if (persisted) {
        results.push({
          ...s,
          id,
          settled: !!persisted.settled,
          settledAt: persisted.settledAt,
          status: persisted.status || (persisted.settled ? 'settled' : 'pending'),
          confirmations: persisted.confirmations || [],
        });
      } else {
        const docRef = doc(db, 'settlements', groupId, 'settlements', id);
        const toSave = cleanUndefinedFields({
          id,
          groupId,
          fromUser: s.fromUser,
          fromUserName: s.fromUserName,
          toUser: s.toUser,
          toUserName: s.toUserName,
          amount: s.amount,
          settled: false,
          status: 'pending',
          confirmations: [],
          createdAt: serverTimestamp(),
        });
        await setDoc(docRef, toSave, { merge: true });
        results.push({ ...s, id, settled: false, status: 'pending', confirmations: [] });
      }
    }
    return results;
  } catch (e) {
    return suggestions;
  }
};

export const confirmSettlement = async (
  groupId: string,
  fromUser: string,
  toUser: string,
  amount: number,
  confirmer: string,
  options?: { id?: string; version?: number }
): Promise<void> => {
  const id = (options && options.id) || settlementIdFor(groupId, fromUser, toUser, amount, options?.version);
  const ref = doc(db, 'settlements', groupId, 'settlements', id);
  const snap = await getDoc(ref);
  const norm = (s: string) => (s || '').toLowerCase();
  const fromNorm = norm(fromUser);
  const toNorm = norm(toUser);
  const confirmerNorm = norm(confirmer);
  const current = snap.exists() ? snap.data() : {};
  const confirmations: string[] = Array.isArray(current.confirmations) ? current.confirmations.map(norm) : [];
  if (!confirmations.includes(confirmerNorm)) confirmations.push(confirmerNorm);
  const bothConfirmed = confirmations.includes(fromNorm) && confirmations.includes(toNorm);
  const payload: any = {
    confirmations,
    status: bothConfirmed ? 'settled' : 'pending',
    settled: bothConfirmed,
  };
  if (bothConfirmed) payload.settledAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
  await invalidateGroupSummary(groupId);
};