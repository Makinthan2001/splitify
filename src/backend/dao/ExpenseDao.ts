import {
    addDoc, collection, deleteDoc, doc, getDoc, getDocs,
    orderBy, query,
    setDoc, updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Expense } from '../models/Expense';
import { GroupSummary } from '../models/Settlement';

export const addExpenseDoc = async (groupId: string, expenseData: any): Promise<string> => {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const docRef = await addDoc(expensesRef, expenseData);
    return docRef.id;
};

export const getExpensesForGroup = async (groupId: string): Promise<Expense[]> => {
    const expensesRef = collection(db, 'expenses', groupId, 'expenses');
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Expense));
};

export const getExpenseDoc = async (groupId: string, expenseId: string): Promise<Expense | null> => {
    const docRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data()
        } as Expense;
    }
    return null;
};

export const updateExpenseDoc = async (groupId: string, expenseId: string, updates: any): Promise<void> => {
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await updateDoc(expenseRef, updates);
};

export const deleteExpenseDoc = async (groupId: string, expenseId: string): Promise<void> => {
    const expenseRef = doc(db, 'expenses', groupId, 'expenses', expenseId);
    await deleteDoc(expenseRef);
};

// Group Summary caching is strictly DAO concern (persistence)
export const saveGroupSummary = async (groupId: string, summary: any): Promise<void> => {
    const summaryRef = doc(db, 'groupSummaries', groupId);
    await setDoc(summaryRef, summary, { merge: true });
};

export const getGroupSummaryDoc = async (groupId: string): Promise<GroupSummary | null> => {
    // Implement if we need to fetch cached summary directly
    // Ideally we recalculate, but this is for caching
    return null;
};
