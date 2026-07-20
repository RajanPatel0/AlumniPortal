import { NextRequest, NextResponse } from 'next/server';
import { resolveLocation } from '@/lib/geocoding';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode');
    const country = searchParams.get('country') || 'India';

    if (!pincode) {
      return NextResponse.json({ error: 'Missing pincode' }, { status: 400 });
    }

    const resolved = await resolveLocation(country, pincode);
    return NextResponse.json({
      city: resolved.city || null,
      state: resolved.state || null,
      country: resolved.country || null,
    });
  } catch (error: any) {
    console.error('[GEOCODE_PINCODE_ROUTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to geocode pincode' }, { status: 500 });
  }
}
