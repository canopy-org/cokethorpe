import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function GET() {
    try {
        const currentUser = await getAuthUser();
        if (!currentUser || !hasRole(currentUser, 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const users = await sql`
      SELECT id, email, name, role, permissions, active, created_at
      FROM users
      ORDER BY created_at DESC
    `;

        return NextResponse.json({ users });
    } catch (error) {
        console.error('List users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}