import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Server configuration error: Bot Token missing' }, { status: 500 });
    }

    if (!SUPABASE_JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error: JWT Secret missing' }, { status: 500 });
    }

    // 1. Verify Telegram WebApp signature
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    // Sort parameters alphabetically
    const keys = Array.from(urlParams.keys()).filter(key => key !== 'hash').sort();
    const dataCheckString = keys.map(key => `${key}=${urlParams.get(key)}`).join('\n');

    // Calculate signature
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Invalid signature. Unauthorized.' }, { status: 401 });
    }

    // 2. Extract User JSON from initData
    const userString = urlParams.get('user');
    if (!userString) {
      return NextResponse.json({ error: 'No user info in initData' }, { status: 400 });
    }

    const user = JSON.parse(userString);
    const chatId = String(user.id);

    // Securely check if user is allowed to access the family dashboard
    const allowedIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map(id => id.trim());
    const adminChatId = process.env.ADMIN_CHAT_ID || allowedIds[0] || chatId; // Default to admin ID

    if (allowedIds.length > 0 && !allowedIds.includes(chatId)) {
      return NextResponse.json({ error: 'Access denied. You are not an allowed family member.' }, { status: 403 });
    }

    // 3. Generate a secure Supabase JWT containing the SHARED family telegram_chat_id
    // This merges husband and wife into the same database view
    const payload = {
      role: 'authenticated',
      telegram_chat_id: adminChatId,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days expiration
    };

    const token = jwt.sign(payload, SUPABASE_JWT_SECRET);

    return NextResponse.json({ token, user });
  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
