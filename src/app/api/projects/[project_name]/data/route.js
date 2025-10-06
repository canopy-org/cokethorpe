import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL);

// Authentication middleware
function authenticate(request) {
    if (process.env.DISABLE_AUTH === 'true') {
        return { authenticated: true };
    }

    const apiKey = request.headers.get('x-api-key') ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
        return { authenticated: false, error: 'API key is required' };
    }

    if (apiKey !== process.env.API_SECRET_KEY) {
        return { authenticated: false, error: 'Invalid API key' };
    }

    return { authenticated: true };
}

// Validate JSON structure
function validateJsonData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid JSON structure' };
    }

    if (Array.isArray(data)) {
        return { valid: false, error: 'Root level arrays not allowed' };
    }

    return { valid: true };
}

// Get or create project
async function ensureProjectExists(projectName) {
    try {
        // Try to get existing project
        let project = await sql`
            SELECT id, project_name, description 
            FROM projects 
            WHERE project_name = ${projectName}
        `;

        if (project.length > 0) {
            return project[0];
        }

        // Create project if it doesn't exist (auto-create on first use)
        project = await sql`
            INSERT INTO projects (project_name, description)
            VALUES (${projectName}, ${`Auto-created project: ${projectName}`})
            RETURNING id, project_name, description
        `;

        return project[0];
    } catch (error) {
        console.error('Error ensuring project exists:', error);
        throw error;
    }
}

// GET - Retrieve data for a specific project
export async function GET(request, { params }) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { project_name } = params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 10;
        const offset = parseInt(searchParams.get('offset')) || 0;
        const id = searchParams.get('id');

        // Check if project exists
        const project = await sql`
            SELECT id FROM projects WHERE project_name = ${project_name}
        `;

        if (project.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        const projectId = project[0].id;

        let results;

        if (id) {
            // Get specific record
            results = await sql`
                SELECT 
                    js.id, 
                    js.data, 
                    js.source_ip,
                    js.user_agent,
                    js.created_at, 
                    js.updated_at,
                    p.project_name
                FROM json_submissions js
                JOIN projects p ON js.project_id = p.id
                WHERE js.id = ${id} AND js.project_id = ${projectId}
            `;

            if (results.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Record not found in this project' },
                    { status: 404 }
                );
            }
        } else {
            // Get all records for this project
            results = await sql`
                SELECT 
                    js.id, 
                    js.data, 
                    js.source_ip,
                    js.user_agent,
                    js.created_at, 
                    js.updated_at
                FROM json_submissions js
                WHERE js.project_id = ${projectId}
                ORDER BY js.created_at DESC 
                LIMIT ${limit} OFFSET ${offset}
            `;
        }

        return NextResponse.json({
            success: true,
            project: project_name,
            data: results,
            pagination: id ? null : {
                limit,
                offset,
                hasMore: results.length === limit
            }
        });

    } catch (error) {
        console.error('GET /api/projects/[project]/data error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to retrieve data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// POST - Submit data to a specific project
export async function POST(request, { params }) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { project_name } = params;
        const jsonData = await request.json();

        // Validate JSON
        const validation = validateJsonData(jsonData);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Get client info
        const clientIP = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Ensure project exists (auto-create if needed)
        const project = await ensureProjectExists(project_name);

        // Insert data
        const result = await sql`
            INSERT INTO json_submissions (data, source_ip, user_agent, project_id)
            VALUES (
                ${JSON.stringify(jsonData)}, 
                ${clientIP}, 
                ${userAgent},
                ${project.id}
            )
            RETURNING id, created_at, project_id
        `;

        return NextResponse.json({
            success: true,
            message: 'Data stored successfully',
            project: project_name,
            id: result[0].id,
            created_at: result[0].created_at,
            source_ip: clientIP
        }, { status: 201 });

    } catch (error) {
        console.error('POST /api/projects/[project]/data error:', error);

        if (error.message.includes('invalid input syntax for type json')) {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON format' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to store data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// PUT - Update data in a specific project
export async function PUT(request, { params }) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { project_name } = params;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID parameter required' },
                { status: 400 }
            );
        }

        const jsonData = await request.json();
        const validation = validateJsonData(jsonData);

        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Get project ID
        const project = await sql`
            SELECT id FROM projects WHERE project_name = ${project_name}
        `;

        if (project.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        // Update only if record belongs to this project
        const result = await sql`
            UPDATE json_submissions 
            SET data = ${JSON.stringify(jsonData)}, updated_at = NOW()
            WHERE id = ${id} AND project_id = ${project[0].id}
            RETURNING id, updated_at
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Record not found in this project' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Data updated successfully',
            project: project_name,
            id: result[0].id,
            updated_at: result[0].updated_at
        });

    } catch (error) {
        console.error('PUT /api/projects/[project]/data error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// DELETE - Remove data from a specific project
export async function DELETE(request, { params }) {
    const auth = authenticate(request);
    if (!auth.authenticated) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const { project_name } = params;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID parameter required' },
                { status: 400 }
            );
        }

        // Get project ID
        const project = await sql`
            SELECT id FROM projects WHERE project_name = ${project_name}
        `;

        if (project.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        // Delete only if record belongs to this project
        const result = await sql`
            DELETE FROM json_submissions 
            WHERE id = ${id} AND project_id = ${project[0].id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Record not found in this project' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Data deleted successfully',
            project: project_name,
            id: result[0].id
        });

    } catch (error) {
        console.error('DELETE /api/projects/[project]/data error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}