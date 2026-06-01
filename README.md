# ⚽ GOOOOOOOOOOOOOOOOOOAL

A soccer-themed goal tracking app for your sales team. Track SMART monthly goals with style.

## Features

- 🎯 4 goal types: Consistent Habit, Daily Streak, Rate Improvement, Hit a Number
- 👥 Multi-player support with colored jerseys and jersey numbers
- 📊 Live progress tracking with animated scoreboard
- ✅ Quick check-in logging with notes
- 🏆 Goal celebration animations when 100% reached
- 📱 Mobile responsive with floating action button
- 💾 Persistent storage via localStorage

## Deploy to Vercel

### Option 1: Vercel CLI (recommended)

```bash
npm install -g vercel
vercel --prod
```

### Option 2: GitHub + Vercel Dashboard

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Deploy (zero config needed — Vercel auto-detects Next.js)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Goal Types

| Type | Use For | Example |
|------|---------|---------|
| ✅ Consistent Habit | Behaviors to do every time | "Mention setup fee on every demo" |
| 🔥 Daily Streak | Daily actions | "Hit 200 WIN daily" |
| 📈 Rate Improvement | Moving a metric from A to B | "Close rate 30% → 40%" |
| 🔢 Hit a Number | Reaching a numeric target | "Book 20 demos this month" |

## Customization

- Edit `lib/storage.ts` to change the demo data loaded on first visit
- Add jersey colors in the `JERSEY_COLORS` object in `lib/storage.ts`
- Adjust the month/team name from the app header (team management)
