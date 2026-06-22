#!/bin/bash
# deploy.sh — AI Assistant Соня v7 Server Deployment Script
# Run on server: bash deploy.sh

set -e

APP_DIR="$HOME/ai-assistant-dashboard"
REPO="https://github.com/myprofile2403-design/ai-executive-dashboard.git"

echo "🚀 Starting AI Assistant Соня v7 deployment..."

# ── 1. Clone or pull latest code ────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "📦 Pulling latest changes..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "📦 Cloning repository..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 2. Write environment variables ──────────────────────────────────────────
# IMPORTANT: Edit this block with your real values before running!
if [ ! -f ".env.local" ]; then
  echo "⚠️  Creating .env.local — EDIT THIS FILE WITH YOUR REAL VALUES!"
  cat > .env.local << 'ENVEOF'
# Telegram Bot Token (from BotFather)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Supabase JWT Secret (from Supabase: Settings > API > JWT Settings > JWT Secret)
SUPABASE_JWT_SECRET=YOUR_SUPABASE_JWT_SECRET_HERE

# Optional: Supabase URL and anon key for SSR
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
ENVEOF
  echo "❌ Please edit .env.local and run this script again!"
  exit 1
fi

# ── 3. Install dependencies ──────────────────────────────────────────────────
echo "📚 Installing dependencies..."
npm install --production=false

# ── 4. Build ─────────────────────────────────────────────────────────────────
echo "🔨 Building Next.js standalone..."
npm run build

# ── 5. Setup systemd service ─────────────────────────────────────────────────
echo "⚙️  Setting up systemd service..."
sudo tee /etc/systemd/system/ai-dashboard.service > /dev/null << SERVICEEOF
[Unit]
Description=AI Assistant Соня Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=$APP_DIR/.env.local

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo systemctl daemon-reload
sudo systemctl enable ai-dashboard
sudo systemctl restart ai-dashboard

# ── 6. Update Supabase schema ────────────────────────────────────────────────
echo ""
echo "📋 NEXT STEPS — run manually in Supabase SQL Editor:"
echo "   1. Execute: supabase_indexes.sql"
echo "   2. Execute: supabase_schema.sql (if not done yet)"
echo ""

# ── 7. Status check ──────────────────────────────────────────────────────────
echo "✅ Deployment complete!"
echo ""
sudo systemctl status ai-dashboard --no-pager
echo ""
echo "🌐 Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo "📝 To view logs: journalctl -u ai-dashboard -f"
