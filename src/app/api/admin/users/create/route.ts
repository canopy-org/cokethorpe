import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, getAuthUser, hasRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        // Check if user is admin
        const currentUser = await getAuthUser();
        if (!currentUser || !hasRole(currentUser, 'admin')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { email, password, name, role, permissions } = await req.json();

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        // Create user
        const passwordHash = await hashPassword(password);
        const result = await sql`
      INSERT INTO users (email, password_hash, name, role, permissions, created_by)
      VALUES (
        ${email}, 
        ${passwordHash}, 
        ${name || null}, 
        ${role || 'viewer'},
        ${JSON.stringify(permissions || [])}::jsonb,
        ${currentUser.id}
      )
      RETURNING id, email, name, role, permissions
    `;

        const user = result[0];

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: 'User creation failed' },
            { status: 500 }
        );
    }
}