import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { sql } from './db';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string, role: string): string {
    return jwt.sign(
        { userId, email, role }, // Add role here
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyToken(token: string) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role?: string };
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

export async function setAuthCookie(token: string) {
    (await cookies()).set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
    });
}

export async function getAuthUser() {
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Get full user info including role and permissions
    const users = await sql`
    SELECT id, email, name, role, permissions, active
    FROM users 
    WHERE id = ${decoded.userId}
  `;

    if (users.length === 0 || !users[0].active) return null;

    return users[0];
}

export async function clearAuthCookie() {
    (await cookies()).delete('auth_token');
}

// Permission checking functions
export function hasRole(user: any, ...roles: string[]): boolean {
    return roles.includes(user.role);
}

export function hasPermission(user: any, permission: string): boolean {
    if (user.role === 'admin') return true; // Admins have all permissions
    return user.permissions?.includes(permission) || false;
}

export function canAccessBuilding(user: any, buildingId: string): boolean {
    if (user.role === 'admin' || user.role === 'manager') return true;

    // Check if user has permission for specific building
    const buildingPermissions = user.permissions?.filter((p: string) => p.startsWith('building:'));
    if (buildingPermissions?.includes(`building:${buildingId}`)) return true;

    return false;
}