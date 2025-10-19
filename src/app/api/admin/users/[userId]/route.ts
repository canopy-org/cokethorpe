import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser, hasRole } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await getAuthUser();
        if (!currentUser || !hasRole(currentUser, 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { name, role, permissions, active } = await req.json();
        const params = await props.params;
        const userId = params.userId;

        await sql`
      UPDATE users
      SET 
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role),
        permissions = COALESCE(${permissions ? JSON.stringify(permissions) : null}::jsonb, permissions),
        active = COALESCE(${active}, active)
      WHERE id = ${userId}
    `;

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ userId: string }> }
) {
    try {
        const currentUser = await getAuthUser();
        if (!currentUser || !hasRole(currentUser, 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const params = await props.params;
        const userId = params.userId;

        // Prevent deleting yourself
        if (currentUser.id === parseInt(userId)) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        await sql`DELETE FROM users WHERE id = ${userId}`;

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}