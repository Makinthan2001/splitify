import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth } from '../backend/config/firebase';
import { getUserGroups } from '../backend/services/GroupService';
import { loginUser as firebaseLogin, logoutUser as firebaseLogout, signUpUser as firebaseSignUp, updateUser } from '../backend/services/UserService';
import { User } from '../types';
import { Action } from './types';

export const signupAction = async (dispatch: React.Dispatch<Action>, email: string, password: string, name: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const firebaseUser = await firebaseSignUp(email, password, name);

        // Map Firebase user to our domain User
        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || name,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined,
        };

        dispatch({ type: 'SET_USER', payload: user });
        return user;
    } catch (error: any) {

        dispatch({ type: 'SET_ERROR', payload: error.message || "Signup failed" });
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

export const loginAction = async (dispatch: React.Dispatch<Action>, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const firebaseUser = await firebaseLogin(email, password);

        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined,
        };

        dispatch({ type: 'SET_USER', payload: user });
        return user;
    } catch (error: any) {

        dispatch({ type: 'SET_ERROR', payload: error.message || "Login failed" });
        return null;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

export const logoutAction = async (dispatch: React.Dispatch<Action>) => {
    try {
        await firebaseLogout();
        dispatch({ type: 'LOGOUT' });
        return true;
    } catch (error: any) {

        return false;
    }
};

export const updateProfileAction = async (dispatch: React.Dispatch<Action>, uid: string, updates: { name?: string; photoURL?: string; bio?: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        // 1. Update Firestore
        await updateUser(uid, updates);

        // 2. Update Firebase Auth Profile
        if (auth.currentUser) {
            const authUpdates: any = {};
            if (updates.name) authUpdates.displayName = updates.name;
            if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
            // Note: Firebase Auth doesn't have a standard bio field, we store it in Firestore
            await firebaseUpdateProfile(auth.currentUser, authUpdates);
        }

        // 3. Update Local State
        dispatch({ type: 'UPDATE_USER', payload: updates as Partial<User> });
        return true;
    } catch (error: any) {

        dispatch({ type: 'SET_ERROR', payload: error.message || "Update failed" });
        return false;
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

export const fetchGroupsAction = async (dispatch: React.Dispatch<Action>, userId: string, forceRefresh = false) => {
    if (forceRefresh) {
        dispatch({ type: 'SET_LOADING', payload: true });
    }
    try {
        const groups = await getUserGroups(userId, !forceRefresh);
        dispatch({ type: 'SET_GROUPS', payload: groups });
    } catch (error: any) {

        dispatch({ type: 'SET_ERROR', payload: error.message || "Failed to fetch groups" });
    } finally {
        if (forceRefresh) {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }
};
