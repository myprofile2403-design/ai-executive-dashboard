import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!SUPABASE_JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error: JWT Secret missing' }, { status: 500 });
    }

    let targetChatId = null;

    // Check User 1
    if (process.env.WEB_PASSWORD && password === process.env.WEB_PASSWORD) {
      targetChatId = process.env.ADMIN_CHAT_ID;
    }
    // Check User 2
    else if (process.env.WEB_PASSWORD_2 && password === process.env.WEB_PASSWORD_2) {
      targetChatId = process.env.ADMIN_CHAT_ID_2;
    }

    if (!targetChatId) {
      return NextResponse.json({ error: 'Неправильний пароль' }, { status: 401 });
    }

    // Generate a secure Supabase JWT
    const payload = {
      role: 'authenticated',
      telegram_chat_id: targetChatId,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days expiration
    };

    const token = jwt.sign(payload, SUPABASE_JWT_SECRET);

    return NextResponse.json({ token, user: { id: targetChatId } });
  } catch (error: any) {
    console.error('Web Authentication error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
