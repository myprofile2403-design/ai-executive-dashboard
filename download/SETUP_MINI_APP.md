# AI Executive Assistant — Telegram Mini App Дешборд

## 🚀 Налаштування Telegram Mini App

### Крок 1: Розгорніть дашборд на GitHub Pages

```bash
# Клонуйте репозиторій
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Встановіть залежності
npm install

# Збілдьте статичний сайт
npm run build

# Папка 'out/' містить готовий сайт
# Завантажте її на GitHub Pages (через git push або GitHub Actions)
```

### Крок 2: Налаштування BotFather

Відкрийте [@BotFather](https://t.me/BotFather) у Telegram та виконайте:

```
/newapp
```

BotFather запитає:
1. **Бот** — оберіть вашого Executive Assistant бота
2. **Назва** — "Executive Dashboard"
3. **Опис** — "Ваш персональний дашборд: задачі, витрати, нотатки"
4. **Фото** — можна пропустити
5. **URL** — `https://YOUR_USERNAME.github.io/YOUR_REPO/`

Після цього в чаті з ботом з'явиться іконка 🚀 біля поля вводу,
яка відкриватиме дашборд як Mini App.

### Крок 3: Оновіть n8n воркфлоу

1. Імпортуйте `AI Executive Assistant v5.json` у n8n
2. Додайте змінну середовища `DASHBOARD_URL`:
   ```
   DASHBOARD_URL=https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```
3. Додайте змінну `TELEGRAM_BOT_TOKEN` (якщо ще немає):
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```
4. Активуйте воркфлоу

### Крок 4: Налаштування Supabase RLS

У Supabase SQL Editor виконайте:

```sql
-- Дозволити anon ключу читати дані
create policy "Allow anon read access"
on events for select
using (true);

-- Дозволити anon ключу оновлювати статус
create policy "Allow anon update status"
on events for update
using (true)
with check (true);
```

### Крок 5: Підключення дашборду

1. Відкрийте дашборд через кнопку в Telegram або за URL
2. Перейдіть у **Налаштування**
3. Введіть Supabase URL та anon key
4. Збережіть — дані з'являться автоматично!

---

## 📱 Як це працює

```
Користувач натискає "📊 Дешборд"
        ↓
Telegram відкриває Mini App (ваш GitHub Pages сайт)
        ↓
Дашборд підключається до Supabase напряму з браузера
        ↓
Користувач бачить задачі, витрати, нотатки, нагадування
```

## 🔑 Змінні середовища n8n (.env)

```env
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...

# Обмеження доступу до бота (Опціонально, через кому. Якщо пусто — доступний усім)
ALLOWED_TELEGRAM_IDS=123456789,987654321
ALLOWED_TELEGRAM_USERNAMES=dara,my_username

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Whisper
WHISPER_SERVER_URL=http://localhost:8000

# Dashboard URL (для Mini App кнопки)
DASHBOARD_URL=https://YOUR_USERNAME.github.io/YOUR_REPO/

# Tavily (опціонально)
TAVILY_API_KEY=tvly-...
```

## 🛠 Технології

- **Next.js 16** + **TypeScript** + **Tailwind CSS 4**
- **shadcn/ui** компоненти
- **Supabase** (пряме підключення з браузера)
- **Telegram Web App SDK** (telegram-web-app.js)
- **Recharts** для графіків витрат
- **Zustand** для стану додатку
- **next-themes** для темної/світлої теми
