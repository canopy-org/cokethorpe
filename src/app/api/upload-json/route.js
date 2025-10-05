// src/app/api/upload-json/route.js
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

// Utility function to validate JSON structure (customize as needed)
function validateJsonData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON structure' };
  }
  
  // Add your specific validation rules here
  // Example validations:
  if (Array.isArray(data)) {
    return { valid: false, error: 'Root level arrays not allowed' };
  }
  
  // Check for required fields (customize these)
  const requiredFields = []; // e.g., ['name', 'email']
  for (const field of requiredFields) {
    if (!(field in data)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  return { valid: true };
}

// GET handler - retrieve JSON data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const id = searchParams.get('id');

    let results;
    
    if (id) {
      // Get specific record
      results = await sql`
        SELECT id, data, created_at, updated_at 
        FROM json_submissions 
        WHERE id = ${id}
      `;
    } else {
      // Get paginated results
      results = await sql`
        SELECT id, data, created_at, updated_at 
        FROM json_submissions 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json({
      success: true,
      data: results,
      pagination: id ? null : {
        limit,
        offset,
        hasMore: results.length === limit
      }
    });

  } catch (error) {
    console.error('GET /api/upload-json error:', error);
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

// POST handler - store JSON data
export async function POST(request) {
  try {
    // Parse request body
    const jsonData = await request.json();
    
    // Validate the JSON data
    const validation = validateJsonData(jsonData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error 
        },
        { status: 400 }
      );
    }

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Store in database
    const result = await sql`
      INSERT INTO json_submissions (data, source_ip, user_agent)
      VALUES (${JSON.stringify(jsonData)}, ${clientIP}, ${userAgent})
      RETURNING id, created_at
    `;

    return NextResponse.json({
      success: true,
      message: 'JSON data stored successfully',
      id: result[0].id,
      created_at: result[0].created_at
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/upload-json error:', error);
    
    // Handle specific error types
    if (error.message.includes('invalid input syntax for type json')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON format' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to store JSON data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT handler - update existing JSON data
export async function PUT(request) {
  try {
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

    const result = await sql`
      UPDATE json_submissions 
      SET data = ${JSON.stringify(jsonData)}
      WHERE id = ${id}
      RETURNING id, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'JSON data updated successfully',
      id: result[0].id,
      updated_at: result[0].updated_at
    });

  } catch (error) {
    console.error('PUT /api/upload-json error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update JSON data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE handler - remove JSON data
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID parameter required' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM json_submissions 
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'JSON data deleted successfully',
      id: result[0].id
    });

  } catch (error) {
    console.error('DELETE /api/upload-json error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete JSON data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}