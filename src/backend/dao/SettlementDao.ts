import {
    collection, doc, getDoc, getDocs, query,
    setDoc,
    updateDoc, where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Settlement } from '../models/Settlement';

export const getSettledSettlements = async (groupId: string): Promise<Settlement[]> => {
    const settledColl = collection(db, 'settlements', groupId, 'settlements');
    const settledQ = query(settledColl, where('settled', '==', true));
    const settledSnap = await getDocs(settledQ);

    return settledSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
    } as unknown as Settlement));
};

export const getSettlementDoc = async (groupId: string, settlementId: string): Promise<Settlement | null> => {
    const docRef = doc(db, 'settlements', groupId, 'settlements', settlementId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as unknown as Settlement;
};

export const updateSettlementDoc = async (groupId: string, settlementId: string, updates: Partial<Settlement>): Promise<void> => {
    const docRef = doc(db, 'settlements', groupId, 'settlements', settlementId);
    await updateDoc(docRef, updates);
};

export const setSettlementDoc = async (groupId: string, settlement: Settlement): Promise<void> => {
    const docRef = doc(db, 'settlements', groupId, 'settlements', settlement.id);
    // Use set with merge true to be safe, though we usually overwrite or create new here
    await setDoc(docRef, settlement, { merge: true });
};

// Implement other settlement related DB ops here if needed
