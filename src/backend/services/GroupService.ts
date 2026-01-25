import { serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';
import {
    addMemberToGroup,
    createGroupDoc,
    deleteGroupDoc,
    findGroupByInviteCode,
    getGroupDoc,
    getGroupsForMember,
    updateGroupDoc,
} from '../dao/GroupDao';
import { getUserDocument, getUserDocumentByEmail } from '../dao/UserDao';
import { Group } from '../models/Group';
import { User } from '../models/User';

let groupsCache: { [uid: string]: { groups: Group[], timestamp: number } } = {};
const CACHE_DURATION = 30000;

export const clearGroupsCache = (uid?: string) => {
    if (uid) delete groupsCache[uid];
    else groupsCache = {};
};

export const createGroup = async (
    hostUid: string,
    name: string,
    description?: string,
    initialMembers: string[] = []
): Promise<string> => {
    try {
        const inviteCode = generateInviteCode();
        const members = [hostUid, ...initialMembers.filter(uid => uid !== hostUid)];

        const groupData: Omit<Group, 'id'> = {
            name,
            description: description || '',
            hostId: hostUid,
            inviteCode,
            members,
            createdAt: serverTimestamp(),
        };

        const id = await createGroupDoc(groupData);
        clearGroupsCache(hostUid);
        return id;
    } catch (error: any) {
        throw new Error(`Failed to create group service: ${error.message}`);
    }
};

export const getUserGroups = async (uid: string, useCache = true): Promise<Group[]> => {
    if (useCache && groupsCache[uid]) {
        const cached = groupsCache[uid];
        if (Date.now() - cached.timestamp <= CACHE_DURATION) return cached.groups;
    }

    try {
        if (!auth.currentUser) throw new Error("User not authenticated");

        const groups = await getGroupsForMember(uid);
        groups.sort((a, b) => a.name.localeCompare(b.name));

        groupsCache[uid] = { groups, timestamp: Date.now() };
        return groups;
    } catch (error: any) {
        if (groupsCache[uid]) return groupsCache[uid].groups;
        throw new Error(`Failed to get user groups service: ${error.message}`);
    }
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
    try {
        // We can add timeout logic here if needed, similar to original service
        return await getGroupDoc(groupId);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to access this group.');
        }
        throw new Error(`Failed to get group service: ${error.message}`);
    }
};

export const addMemberByEmail = async (groupId: string, email: string): Promise<void> => {
    try {
        const user = await getUserDocumentByEmail(email);
        if (!user) throw new Error('User not found with this email address');
        await addMemberToGroup(groupId, user.uid);
    } catch (error: any) {
        throw new Error(`Failed to add member service: ${error.message}`);
    }
};

export const joinGroupByInviteCode = async (inviteCode: string, uid: string): Promise<string> => {
    try {
        const group = await findGroupByInviteCode(inviteCode);
        if (!group) throw new Error('Invalid invite code');

        if (group.members.includes(uid)) {
            throw new Error('You are already a member of this group');
        }

        await addMemberToGroup(group.id, uid);
        return group.id;
    } catch (error: any) {
        throw new Error(`Failed to join group service: ${error.message}`);
    }
};

export const getGroupMembers = async (memberUids: string[]): Promise<User[]> => {
    try {
        const members: User[] = [];
        for (const uid of memberUids) {
            const user = await getUserDocument(uid);
            if (user) members.push(user);
        }
        return members;
    } catch (error: any) {
        throw new Error(`Failed to get group members service: ${error.message}`);
    }
};

export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<void> => {
    try {
        await updateGroupDoc(groupId, updates);
    } catch (error: any) {
        throw new Error(`Failed to update group service: ${error.message}`);
    }
}

export const deleteGroup = async (groupId: string): Promise<void> => {
    try {
        await deleteGroupDoc(groupId);
        // Clear everyone's cache effectively, but since we can't easily clear others', 
        // at least clear the current user's locally to trigger refetch.
        if (auth.currentUser) {
            clearGroupsCache(auth.currentUser.uid);
        } else {
            clearGroupsCache();
        }
    } catch (error: any) {
        throw new Error(`Failed to delete group service: ${error.message}`);
    }
}

const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
