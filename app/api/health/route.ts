import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 * Used by offline sync manager to check connection status
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}
