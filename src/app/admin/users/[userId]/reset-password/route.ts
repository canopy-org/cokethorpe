import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser, hasRole, hashPassword } from '@/lib/auth';

export async function POST(
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

        const { newPassword } = await req.json();
        const params = await props.params;
        const userId = params.userId;

        // Validation
        if (!newPassword) {
            return NextResponse.json(
                { error: 'New password required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE id = ${userId}
    `;

        return NextResponse.json({
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Password reset failed' },
            { status: 500 }
        );
    }
}