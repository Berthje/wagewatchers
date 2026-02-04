import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import your database client
    const { db } = await import('@/lib/db');
    
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}