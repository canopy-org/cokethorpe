export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'viewer' | 'custom';
    permissions: string[];
    active: boolean;
    created_at: Date;
}