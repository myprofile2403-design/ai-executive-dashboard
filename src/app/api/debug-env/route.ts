import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
    hasWebPassword: !!process.env.WEB_PASSWORD,
    hasAdminChatId: !!process.env.ADMIN_CHAT_ID,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
  });
}
