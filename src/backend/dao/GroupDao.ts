import {
    addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs,
    query,
    updateDoc, where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Group } from '../models/Group';

export const createGroupDoc = async (groupData: any): Promise<string> => {
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return docRef.id;
};

export const getGroupsForMember = async (uid: string): Promise<Group[]> => {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Group));
};

export const getGroupDoc = async (groupId: string): Promise<Group | null> => {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data(),
        } as Group;
    }
    return null;
};

export const updateGroupDoc = async (groupId: string, updates: Partial<Group>): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, updates);
};

export const deleteGroupDoc = async (groupId: string): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
};

export const findGroupByInviteCode = async (inviteCode: string): Promise<Group | null> => {
    const q = query(
        collection(db, 'groups'),
        where('inviteCode', '==', inviteCode.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Group;
};

export const addMemberToGroup = async (groupId: string, uid: string): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
        members: arrayUnion(uid)
    });
};
