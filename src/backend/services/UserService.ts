import { serverTimestamp } from 'firebase/firestore';
import {
    createUserDocument,
    getUserDocument,
    getUserDocumentByEmail,
    updateUserDocument,
} from '../dao/UserDao';
import { User } from '../models/User';

export const createUser = async (uid: string, email: string, name?: string): Promise<void> => {
    try {
        const userName = name && name.trim() ? name.trim() : email.split('@')[0];
        const userData: Omit<User, 'uid'> = {
            email: email.toLowerCase().trim(),
            name: userName,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
        };
        await createUserDocument(uid, userData);
    } catch (error: any) {
        throw new Error(`Failed to create user service: ${error.message}`);
    }
};

export const getUser = async (uid: string): Promise<User | null> => {
    try {
        return await getUserDocument(uid);
    } catch (error: any) {
        throw new Error(`Failed to get user service: ${error.message}`);
    }
};

export const updateUser = async (uid: string, updates: Partial<User>): Promise<void> => {
    try {
        await updateUserDocument(uid, updates);
    } catch (error: any) {
        throw new Error(`Failed to update user service: ${error.message}`);
    }
};

export const updateLastSeen = async (uid: string): Promise<void> => {
    try {
        await updateUserDocument(uid, { lastSeen: serverTimestamp() });
    } catch (error: any) {
        // Silent fail
    }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    try {
        return await getUserDocumentByEmail(email);
    } catch (error: any) {
        throw new Error(`Failed to find user by email service: ${error.message}`);
    }
};

// Auth Logic
import {
    createUserWithEmailAndPassword,
    updateProfile as firebaseUpdateProfile,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { auth } from "../config/firebase";

export const signUpUser = async (email: string, password: string, displayName?: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (displayName) {
            await firebaseUpdateProfile(user, { displayName });
        }

        await createUser(user.uid, user.email!, displayName);

        try {
            await sendEmailVerification(user);
        } catch (emailError: any) {
            // Silent fail
        }

        return user;
    } catch (error: any) {
        throw new Error((error as any).code || error.message);
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const existingUserDoc = await getUser(user.uid);
        if (!existingUserDoc) {
            try {
                await createUser(user.uid, user.email!, user.displayName || '');
            } catch (docError: any) { }
        }

        await updateLastSeen(user.uid);
        return user;
    } catch (error: any) {
        throw new Error((error as any).code || error.message);
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error("Failed to sign out. Please try again.");
    }
};

export const sendVerificationEmail = async () => {
    try {
        if (!auth.currentUser) throw new Error("No user is currently signed in.");
        const user = auth.currentUser;
        await user.reload();
        if (user.emailVerified) throw new Error("Email is already verified.");

        const actionCodeSettings = {
            url: `https://${auth.app.options.authDomain}/?email=${user.email}`,
            handleCodeInApp: false
        };

        await sendEmailVerification(user, actionCodeSettings);
        return {
            success: true,
            userEmail: user.email,
            timestamp: new Date().toISOString()
        };
    } catch (error: any) {
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

export const checkEmailVerification = async () => {
    try {
        if (!auth.currentUser) throw new Error("No user is currently signed in.");
        const user = auth.currentUser;
        await reload(user);
        return user.emailVerified;
    } catch (error: any) {
        throw new Error(`Failed to check email verification: ${error.message}`);
    }
};
