// User model definition
export interface User {
    uid: string;
    name?: string;
    email: string;
    photoURL?: string;
    bio?: string;
    emailVerified?: boolean;
    createdAt: any;
    lastSeen?: any;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials extends LoginCredentials {
    displayName: string;
    confirmPassword: string;
}
