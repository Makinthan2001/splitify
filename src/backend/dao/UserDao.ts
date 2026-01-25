import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../models/User';

export const createUserDocument = async (uid: string, userData: Omit<User, 'uid'>): Promise<void> => {
    await setDoc(doc(db, 'users', uid), userData);
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        return {
            uid: userDoc.id,
            ...userDoc.data(),
        } as User;
    }
    return null;
};

export const updateUserDocument = async (uid: string, updates: Partial<User>): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        ...updates,
        lastSeen: serverTimestamp(),
    });
};

export const getUserDocumentByEmail = async (email: string): Promise<User | null> => {
    const trimmed = email.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', trimmed));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const docSnap = snap.docs[0];
        return {
            uid: docSnap.id,
            ...docSnap.data(),
        } as User;
    }
    return null;
};
