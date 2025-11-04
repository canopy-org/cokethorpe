import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        // Check if user is authenticated
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await req.json();

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'New password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Get user's current password hash
        const users = await sql`
      SELECT password_hash FROM users WHERE id = ${user.id}
    `;

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isValid = await verifyPassword(currentPassword, users[0].password_hash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Hash and update new password
        const newPasswordHash = await hashPassword(newPassword);
        await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}
      WHERE id = ${user.id}
    `;

        return NextResponse.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { error: 'Password change failed' },
            { status: 500 }
        );
    }
}