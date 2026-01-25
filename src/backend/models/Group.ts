// Group model definition
export interface Group {
    id: string;
    name: string;
    description?: string;
    hostId: string;
    inviteCode?: string;
    members: string[];
    photoURL?: string;
    createdAt: any;
}

export interface Member {
    uid: string;
    role: "member" | "admin" | "host";
    joinedAt: any;
    displayName: string;
}
