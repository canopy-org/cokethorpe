import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

function authenticate(request) {
    if (process.env.DISABLE_AUTH === 'true') {
        return { authenticated: true };
    }

    const apiKey = request.headers.get('x-api-key') ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return { authenticated: false, error: 'Invalid or missing API key' };
    }

    return { authenticated: true };
}

// GET - List all projects with statistics
export async function GET(request) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const projectName = searchParams.get('name');

        if (projectName) {
            // Get specific project with detailed stats
            const projectData = await sql`
                SELECT 
                    p.id,
                    p.project_name,
                    p.description,
                    p.created_at,
                    p.updated_at,
                    COUNT(js.id) as submission_count,
                    MIN(js.created_at) as first_submission,
                    MAX(js.created_at) as last_submission,
                    COUNT(DISTINCT js.source_ip) as unique_ips
                FROM projects p
                LEFT JOIN json_submissions js ON p.id = js.project_id
                WHERE p.project_name = ${projectName}
                GROUP BY p.id, p.project_name, p.description, p.created_at, p.updated_at
            `;

            if (projectData.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Project not found' },
                    { status: 404 }
                );
            }

            // Get recent submissions
            const recentSubmissions = await sql`
                SELECT id, created_at, source_ip
                FROM json_submissions
                WHERE project_id = ${projectData[0].id}
                ORDER BY created_at DESC
                LIMIT 5
            `;

            return NextResponse.json({
                success: true,
                data: {
                    ...projectData[0],
                    recent_submissions: recentSubmissions
                }
            });
        }

        // Get all projects with counts
        const projects = await sql`
            SELECT 
                p.id,
                p.project_name,
                p.description,
                p.created_at,
                p.updated_at,
                COUNT(js.id) as submission_count,
                MAX(js.created_at) as last_submission
            FROM projects p
            LEFT JOIN json_submissions js ON p.id = js.project_id
            GROUP BY p.id, p.project_name, p.description, p.created_at, p.updated_at
            ORDER BY p.created_at DESC
        `;

        return NextResponse.json({
            success: true,
            count: projects.length,
            data: projects
        });

    } catch (error) {
        console.error('GET /api/projects error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to retrieve projects',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// POST - Create a new project
export async function POST(request) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { project_name, description } = await request.json();

        if (!project_name) {
            return NextResponse.json(
                { success: false, error: 'project_name is required' },
                { status: 400 }
            );
        }

        // Validate project name format (lowercase, hyphens, numbers only)
        const validNamePattern = /^[a-z0-9-]+$/;
        if (!validNamePattern.test(project_name)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'project_name must contain only lowercase letters, numbers, and hyphens'
                },
                { status: 400 }
            );
        }

        const result = await sql`
            INSERT INTO projects (project_name, description)
            VALUES (${project_name}, ${description || null})
            RETURNING id, project_name, description, created_at
        `;

        return NextResponse.json({
            success: true,
            message: 'Project created successfully',
            data: result[0],
            endpoint: `/api/projects/${project_name}/data`
        }, { status: 201 });

    } catch (error) {
        console.error('POST /api/projects error:', error);

        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            return NextResponse.json(
                { success: false, error: 'Project name already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create project',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// PUT - Update project details
export async function PUT(request) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const projectName = searchParams.get('name');

        if (!projectName) {
            return NextResponse.json(
                { success: false, error: 'name parameter is required' },
                { status: 400 }
            );
        }

        const { new_name, description } = await request.json();

        if (!new_name && !description) {
            return NextResponse.json(
                { success: false, error: 'Either new_name or description must be provided' },
                { status: 400 }
            );
        }

        // Validate new name if provided
        if (new_name) {
            const validNamePattern = /^[a-z0-9-]+$/;
            if (!validNamePattern.test(new_name)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'new_name must contain only lowercase letters, numbers, and hyphens'
                    },
                    { status: 400 }
                );
            }
        }

        const result = await sql`
            UPDATE projects 
            SET 
                project_name = COALESCE(${new_name}, project_name),
                description = COALESCE(${description}, description),
                updated_at = NOW()
            WHERE project_name = ${projectName}
            RETURNING id, project_name, description, updated_at
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Project updated successfully',
            data: result[0],
            endpoint: `/api/projects/${result[0].project_name}/data`
        });

    } catch (error) {
        console.error('PUT /api/projects error:', error);

        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            return NextResponse.json(
                { success: false, error: 'Project name already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update project',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a project and optionally its data
export async function DELETE(request) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const projectName = searchParams.get('name');
        const deleteData = searchParams.get('delete_data') === 'true';

        if (!projectName) {
            return NextResponse.json(
                { success: false, error: 'name parameter is required' },
                { status: 400 }
            );
        }

        // Get project ID and submission count
        const project = await sql`
            SELECT p.id, p.project_name, COUNT(js.id) as submission_count
            FROM projects p
            LEFT JOIN json_submissions js ON p.id = js.project_id
            WHERE p.project_name = ${projectName}
            GROUP BY p.id, p.project_name
        `;

        if (project.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        const submissionCount = parseInt(project[0].submission_count);

        if (deleteData) {
            // Delete all submissions first
            await sql`
                DELETE FROM json_submissions 
                WHERE project_id = ${project[0].id}
            `;
        } else if (submissionCount > 0) {
            // Don't allow deletion if there's data
            return NextResponse.json(
                {
                    success: false,
                    error: `Cannot delete project with ${submissionCount} submissions. Use delete_data=true to force delete.`
                },
                { status: 400 }
            );
        }

        // Delete the project
        const result = await sql`
            DELETE FROM projects 
            WHERE id = ${project[0].id}
            RETURNING id, project_name
        `;

        return NextResponse.json({
            success: true,
            message: 'Project deleted successfully',
            data: result[0],
            submissions_deleted: deleteData ? submissionCount : 0
        });

    } catch (error) {
        console.error('DELETE /api/projects error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete project',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}