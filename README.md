# 🎯 UC Bounty

**Real rewards app. Watch ads, complete offers, earn points, redeem UC.**

A fully working web app where users earn points (6000 pts = 300 UC by default) and request UC transfer to their PUBG Mobile account. 100% free, works on any network, any phone.

## ✨ Features

### User side
- 📺 Watch video ads (+5 pts)
- 🧠 Daily 5-question quiz (+2 per correct)
- 🎰 Lucky spin (5-100 pts)
- 📥 Download apps via CPA offer wall (+30-50 pts)
- 🎮 Tap-speed mini game
- 🔥 Daily check-in streak
- 👥 Referral system (+50 per friend)
- ⭐ 5-star rating gate before redeem
- ⏳ 3-hour cooldown for free users / instant for premium
- 💎 Premium tier (simulated, you activate manually)

### Admin side
- 🔐 Password-protected dashboard at `/admin.html`
- 📊 Live stats (users, pending UC, revenue)
- 💰 View & approve/reject redeem requests
- 👥 User management (ban, premium, edit points)
- ⚙️ Change all settings (point rate, UC amount, cooldown, ad links)
- 📢 Send global announcements

## 🚀 Deploy (Free, Public URL)

### Option A: Render.com (recommended, 100% free)
1. Push this folder to a GitHub repo
2. Go to https://render.com → Sign up free
3. Click "New +" → "Blueprint" → Connect your repo
4. Render auto-detects `render.yaml` and deploys
5. Your app is live at `https://uc-bounty.onrender.com`

### Option B: Termux (testing on your phone)
```bash
cd ~/uc-earner-real
npm install
node server.js
# Open http://localhost:3000 on your phone
```

## 🔑 Admin access

- URL: `https://your-app.onrender.com/admin.html`
- Default password: `admin123`
- **Change it immediately in the admin settings page**

## 💰 Ad integration (to earn money)

Sign up free at:
- **Adsterra**: https://www.adsterra.com (best for new publishers)
- **Monetag**: https://monetag.com
- **Adsterra Smartlink** for CPA downloads

Then paste your ad links in admin → Settings:
- `Adsterra Link` — used for "Watch Ad" button
- `Monetag Link` — backup
- `OfferWall Link` — for download offers (CPA revenue)

## 💵 Money flow

1. Users watch ads → you earn from ad network (~$0.5-$2 per 1000 views)
2. You publish app on Play Store → earn from Play Store revenue
3. Users reach 6000 pts → request UC redeem
4. You buy UC on Midasbuy → transfer manually to their PUBG ID
5. Mark request as "Paid" in admin panel

## 🎨 Customize

Open `public/style.css` and change CSS variables at the top:
```css
:root {
  --orange: #FF6B00;   /* main color */
  --gold: #FFD700;     /* premium */
  --cyan: #00E5FF;     /* success */
  --bg: #0A0A0A;       /* background */
}
```

## 📁 Files

- `server.js` — Backend (Node + Express)
- `public/index.html` — Main app
- `public/admin.html` — Admin dashboard
- `public/app.js` — Frontend logic
- `public/style.css` — Theme
- `db.json` — Auto-created database (users, requests, settings)
- `render.yaml` — One-click Render deploy

## ⚙️ Default settings (change in admin)

| Setting | Value |
|---|---|
| Points per UC | 20 |
| UC per redeem | 300 |
| Min points to redeem | 6000 |
| Free cooldown | 3 hours |
| Premium cooldown | 0 (instant) |
| Daily ad limit | 50 |
| Signup bonus | 50 pts |

## 🔒 Anti-fraud built in

- One account per device (device fingerprint)
- Daily ad limit
- Server-side point validation (no client cheating)
- Admin can ban users
- Admin can adjust points manually

## 📱 Install as PWA on phone

Open in Chrome/Safari → "Add to Home Screen" → app icon appears like a native app.

---
Made with 🔥 for PUBG Mobile players.
