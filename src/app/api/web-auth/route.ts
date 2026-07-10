import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const WEB_PASSWORD = process.env.WEB_PASSWORD || '1234';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!SUPABASE_JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error: JWT Secret missing' }, { status: 500 });
    }

    if (!password || password.trim() !== WEB_PASSWORD.trim()) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate a secure Supabase JWT listing every family member's chat id
    const familyIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
    const payload = {
      role: 'authenticated',
      family_ids: familyIds,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days expiration
    };

    const token = jwt.sign(payload, SUPABASE_JWT_SECRET);

    return NextResponse.json({ token, user: { id: familyIds[0] || '0' } });
  } catch (error: any) {
    console.error('Web Authentication error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
