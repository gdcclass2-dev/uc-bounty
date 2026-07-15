// UC Bounty - Real backend (v2: anti-fraud + bigger quiz bank)
// Run: node server.js
// Free deploy: render.com (see render.yaml + README.md)

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ============ DATABASE ============
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const init = {
      users: {},          // deviceId -> user
      sessions: {},       // token -> deviceId
      redeemRequests: [], // array of requests
      settings: {
        pointsPerUc: 20,            // 20 points = 1 UC (so 6000 pts = 300 UC)
        ucPerRedeem: 300,           // amount of UC per redeem
        minPointsToRedeem: 6000,    // unlock threshold
        freeRedeemCooldownHours: 3, // free user cooldown
        premiumRedeemCooldownHours: 0, // premium = instant
        dailyAdLimit: 999999,      // effectively unlimited ads per day
        signupBonus: 50,            // free points on signup
        adWatchSeconds: 5,         // required seconds to fully watch an ad
        offerWaitSeconds: 30,       // required seconds before offer can be claimed
        adCooldownSeconds: 0,       // NO cooldown between ads
        quizCooldownSeconds: 30,    // per-question cooldown
        quizPerDay: 5,              // max quiz questions per day
        adminPassword: '@663629$',  // CHANGE THIS in admin panel - your secret password
        adsterraLink: 'https://www.profitabledisplaynetwork.com/xxxx',
        monetagLink: 'https://otieu.com/4/xxxx',
        offerWallLink: 'https://omg10.com/4/11286726',
        announcements: [],
        // 30-QUESTION PUBG QUIZ BANK (admin-tunable)
        quizQuestions: [
          { q: "Which map in PUBG Mobile is the smallest?", opts: ["Erangel","Sanhok","Miramar","Vikendi"], a: 1 },
          { q: "What does 'UC' stand for in PUBG?", opts: ["Unknown Cash","Unknown Coin","Universal Credit","Ultra Cash"], a: 1 },
          { q: "How many players start a classic Erangel match?", opts: ["50","75","100","64"], a: 2 },
          { q: "Which weapon is known as 'the king of sniper rifles'?", opts: ["M24","AWM","Kar98k","M82B"], a: 1 },
          { q: "What is the max level in PUBG Mobile (basic)?", opts: ["50","75","100","120"], a: 2 },
          { q: "Which gun fires .300 magnum ammo?", opts: ["M24","AWM","Kar98k","Mk14"], a: 1 },
          { q: "What is the name of the level-3 helmet in PUBG?", opts: ["Spetznaz","Military","Riot","Tactical"], a: 0 },
          { q: "Which throwable is best for clearing a room?", opts: ["Smoke","Frag","Molotov","Stun"], a: 1 },
          { q: "How long does a smoke grenade last?", opts: ["15s","30s","45s","60s"], a: 2 },
          { q: "Which vehicle is fastest on road?", opts: ["UAZ","Dacia","Motorcycle","Buggy"], a: 2 },
          { q: "What is the maximum squad size in Squad mode?", opts: ["2","3","4","5"], a: 2 },
          { q: "Which map has the 'Boot Camp' area?", opts: ["Erangel","Sanhok","Vikendi","Miramar"], a: 1 },
          { q: "Which scope is best for long range sniping?", opts: ["Red Dot","Holo","4x","8x"], a: 3 },
          { q: "What does 'BOT' mean in PUBG?", opts: ["Beginner Opponent","AI-controlled player","Boot of the team","Bad opponent today"], a: 1 },
          { q: "Which ammo type does the AKM use?", opts: ["5.56mm","7.62mm","9mm",".45 ACP"], a: 1 },
          { q: "Which ammo type does the M416 use?", opts: ["5.56mm","7.62mm","9mm",".45 ACP"], a: 0 },
          { q: "What color is the Flare Gun's signal?", opts: ["Red","Green","Yellow","Blue"], a: 0 },
          { q: "What does a Flare Gun summon when shot in the air?", opts: ["Airdrop","UAV","Supply chopper","Nothing"], a: 0 },
          { q: "What is the max backpack capacity (level 3)?", opts: ["150","200","250","300"], a: 2 },
          { q: "How many attachments does the M416 support?", opts: ["3","4","5","6"], a: 2 },
          { q: "Which gun has the highest single-shot damage?", opts: ["AKM","DP-28","AWM","M249"], a: 2 },
          { q: "What is the 'Chicken Dinner' in PUBG?", opts: ["1st place","Last kill","A meal","Easter egg"], a: 0 },
          { q: "Which map is the desert map?", opts: ["Erangel","Miramar","Vikendi","Sanhok"], a: 1 },
          { q: "Which map is the snow map?", opts: ["Sanhok","Erangel","Vikendi","Karakin"], a: 2 },
          { q: "What is the name of the new map in PUBG (2020) with small city?", opts: ["Karakin","Fourex","Paramo","Livik"], a: 2 },
          { q: "Which item revives a knocked teammate?", opts: ["First Aid Kit","Med Kit","Adrenaline Syringe","Nothing"], a: 3 },
          { q: "How many kills make 'an Ace' tier?", opts: ["1","2","3","Doesn't matter"], a: 3 },
          { q: "What does TPP mean?", opts: ["Third Person Perspective","Two Player Party","Top Player Prize","Tactical Pro Pack"], a: 0 },
          { q: "Which scope zooms in the most?", opts: ["2x","4x","6x","8x"], a: 3 },
          { q: "How long does a match of PUBG Mobile typically last?", opts: ["10 min","20 min","30 min","45 min"], a: 2 }
        ],
        spinRewards: [5, 10, 15, 20, 25, 30, 50, 75, 100]
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function saveDB() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
let db = loadDB();

// One-time: if existing db has only 5 quiz questions, replace with new 30-question bank
if (db.settings.quizQuestions && db.settings.quizQuestions.length < 25) {
  const newBank = [
    { q: "Which map in PUBG Mobile is the smallest?", opts: ["Erangel","Sanhok","Miramar","Vikendi"], a: 1 },
    { q: "What does 'UC' stand for in PUBG?", opts: ["Unknown Cash","Unknown Coin","Universal Credit","Ultra Cash"], a: 1 },
    { q: "How many players start a classic Erangel match?", opts: ["50","75","100","64"], a: 2 },
    { q: "Which weapon is known as 'the king of sniper rifles'?", opts: ["M24","AWM","Kar98k","M82B"], a: 1 },
    { q: "What is the max level in PUBG Mobile (basic)?", opts: ["50","75","100","120"], a: 2 },
    { q: "Which gun fires .300 magnum ammo?", opts: ["M24","AWM","Kar98k","Mk14"], a: 1 },
    { q: "What is the name of the level-3 helmet in PUBG?", opts: ["Spetznaz","Military","Riot","Tactical"], a: 0 },
    { q: "Which throwable is best for clearing a room?", opts: ["Smoke","Frag","Molotov","Stun"], a: 1 },
    { q: "How long does a smoke grenade last?", opts: ["15s","30s","45s","60s"], a: 2 },
    { q: "Which vehicle is fastest on road?", opts: ["UAZ","Dacia","Motorcycle","Buggy"], a: 2 },
    { q: "What is the maximum squad size in Squad mode?", opts: ["2","3","4","5"], a: 2 },
    { q: "Which map has the 'Boot Camp' area?", opts: ["Erangel","Sanhok","Vikendi","Miramar"], a: 1 },
    { q: "Which scope is best for long range sniping?", opts: ["Red Dot","Holo","4x","8x"], a: 3 },
    { q: "What does 'BOT' mean in PUBG?", opts: ["Beginner Opponent","AI-controlled player","Boot of the team","Bad opponent today"], a: 1 },
    { q: "Which ammo type does the AKM use?", opts: ["5.56mm","7.62mm","9mm",".45 ACP"], a: 1 },
    { q: "Which ammo type does the M416 use?", opts: ["5.56mm","7.62mm","9mm",".45 ACP"], a: 0 },
    { q: "What color is the Flare Gun's signal?", opts: ["Red","Green","Yellow","Blue"], a: 0 },
    { q: "What does a Flare Gun summon when shot in the air?", opts: ["Airdrop","UAV","Supply chopper","Nothing"], a: 0 },
    { q: "What is the max backpack capacity (level 3)?", opts: ["150","200","250","300"], a: 2 },
    { q: "How many attachments does the M416 support?", opts: ["3","4","5","6"], a: 2 },
    { q: "Which gun has the highest single-shot damage?", opts: ["AKM","DP-28","AWM","M249"], a: 2 },
    { q: "What is the 'Chicken Dinner' in PUBG?", opts: ["1st place","Last kill","A meal","Easter egg"], a: 0 },
    { q: "Which map is the desert map?", opts: ["Erangel","Miramar","Vikendi","Sanhok"], a: 1 },
    { q: "Which map is the snow map?", opts: ["Sanhok","Erangel","Vikendi","Karakin"], a: 2 },
    { q: "What is the name of the new map in PUBG (2020) with small city?", opts: ["Karakin","Fourex","Paramo","Livik"], a: 2 },
    { q: "Which item revives a knocked teammate?", opts: ["First Aid Kit","Med Kit","Adrenaline Syringe","Nothing"], a: 3 },
    { q: "How many kills make 'an Ace' tier?", opts: ["1","2","3","Doesn't matter"], a: 3 },
    { q: "What does TPP mean?", opts: ["Third Person Perspective","Two Player Party","Top Player Prize","Tactical Pro Pack"], a: 0 },
    { q: "Which scope zooms in the most?", opts: ["2x","4x","6x","8x"], a: 3 },
    { q: "How long does a match of PUBG Mobile typically last?", opts: ["10 min","20 min","30 min","45 min"], a: 2 }
  ];
  db.settings.quizQuestions = newBank;
  // also add the new settings keys if missing
  if (typeof db.settings.adWatchSeconds !== 'number') db.settings.adWatchSeconds = 10;
  if (typeof db.settings.offerWaitSeconds !== 'number') db.settings.offerWaitSeconds = 30;
  if (typeof db.settings.adCooldownSeconds !== 'number') db.settings.adCooldownSeconds = 0;
  if (typeof db.settings.quizCooldownSeconds !== 'number') db.settings.quizCooldownSeconds = 30;
  if (typeof db.settings.quizPerDay !== 'number') db.settings.quizPerDay = 5;
  saveDB();
  console.log('✅ Seeded 30-question PUBG quiz bank + new anti-fraud settings');
}

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getDevice(req) {
  return req.headers['x-device-id'] || req.body?.deviceId || 'unknown';
}
function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.body?.token;
  const deviceId = db.sessions[token];
  if (!deviceId || !db.users[deviceId]) return res.status(401).json({ error: 'Unauthorized' });
  req.user = db.users[deviceId];
  req.deviceId = deviceId;
  next();
}
function adminAuth(req, res, next) {
  const pw = req.headers['x-admin-password'] || req.body?.password;
  if (pw !== db.settings.adminPassword) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ============ API: AUTH ============
app.post('/api/signup', (req, res) => {
  const { username, pubgId, deviceId, fp } = req.body;
  if (!username || !deviceId) return res.status(400).json({ error: 'Missing fields' });
  if (username.length < 3 || username.length > 16) return res.status(400).json({ error: 'Username 3-16 chars' });
  if (db.users[deviceId]) return res.status(409).json({ error: 'Device already registered' });

  const taken = Object.values(db.users).find(u => u.username.toLowerCase() === username.toLowerCase());
  if (taken) return res.status(409).json({ error: 'Username taken' });

  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = deviceId;
  const now = Date.now();
  db.users[deviceId] = {
    deviceId,
    fp: fp || '',
    username,
    pubgId: pubgId || '',
    points: db.settings.signupBonus,
    totalPointsEarned: db.settings.signupBonus,
    level: 1,
    xp: 0,
    premium: false,
    premiumUntil: 0,
    isAdmin: false,
    banned: false,
    createdAt: now,
    lastActive: now,
    lastCheckin: 0,
    checkinStreak: 0,
    adsWatchedToday: 0,
    adsResetAt: now + 86400000,
    quizDoneToday: 0,
    quizResetAt: now + 86400000,
    spinLastAt: 0,
    referrals: [],
    referredBy: req.body.refCode || '',
    socialLast: {},  // { platform: timestamp } - 12h cooldown per social
    lastRedeem: 0,
    lastRatingSubmit: 0,
    pendingRedeem: null,
    redeemedCount: 0,
    // NEW: anti-fraud timing trackers
    lastAdClaimAt: 0,
    lastOfferClaimAt: {},
    quizAnsweredToday: [],   // [{qHash, t}] - prevents same question twice a day
    dailyAdPointTotal: 0,    // total points from ads today (capped)
    dailyOfferPointTotal: 0, // total points from offers today (capped)
    dailyPointResetAt: now + 86400000
  };
  if (req.body.refCode) {
    const ref = Object.values(db.users).find(u => u.referralCode === req.body.refCode);
    if (ref && ref.deviceId !== deviceId) {
      ref.points += 50;
      ref.totalPointsEarned += 50;
      ref.referrals.push(deviceId);
    }
  }
  saveDB();
  res.json({ ok: true, token, user: db.users[deviceId] });
});

app.post('/api/login', (req, res) => {
  const { deviceId } = req.body;
  const user = db.users[deviceId];
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (user.banned) return res.status(403).json({ error: 'Banned' });
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = deviceId;
  saveDB();
  res.json({ ok: true, token, user });
});

app.get('/api/me', auth, (req, res) => {
  req.user.lastActive = Date.now();
  saveDB();
  res.json({ user: req.user, settings: publicSettings() });
});

function publicSettings() {
  const { adminPassword, ...safe } = db.settings;
  return safe;
}

// ============ ANTI-FRAUD HELPER ============
function resetDailyCounters(u) {
  const now = Date.now();
  if (now > (u.dailyPointResetAt || 0)) {
    u.adsWatchedToday = 0;
    u.quizDoneToday = 0;
    u.quizAnsweredToday = [];
    u.dailyAdPointTotal = 0;
    u.dailyOfferPointTotal = 0;
    u.adsResetAt = now + 86400000;
    u.quizResetAt = now + 86400000;
    u.dailyPointResetAt = now + 86400000;
  }
}

// ============ API: EARN ============

// Ad start: client tells server "I'm starting an ad" -> server returns a token + timestamp
app.post('/api/earn/ad/start', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  if (u.adsWatchedToday >= db.settings.dailyAdLimit) return res.status(429).json({ error: 'Daily ad limit reached' });
  const cooldown = (db.settings.adCooldownSeconds || 0) * 1000;
  if (u.lastAdClaimAt && (now - u.lastAdClaimAt) < cooldown) {
    return res.status(429).json({ error: `Wait ${Math.ceil((cooldown - (now - u.lastAdClaimAt)) / 1000)}s between ads` });
  }
  // Issue a one-time token bound to device
  const adToken = crypto.randomBytes(16).toString('hex');
  u._pendingAd = { token: adToken, startedAt: now };
  saveDB();
  res.json({ ok: true, adToken, startedAt: now, waitSeconds: db.settings.adWatchSeconds || 10 });
});

// Ad claim: client must show token + claim - server verifies elapsed time
app.post('/api/earn/ad/claim', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  const { adToken } = req.body;
  const pending = u._pendingAd;
  if (!pending || pending.token !== adToken) {
    return res.status(400).json({ error: 'No ad in progress. Tap "Watch Ad" again.' });
  }
  const required = (db.settings.adWatchSeconds || 10) * 1000;
  const elapsed = now - pending.startedAt;
  if (elapsed < required) {
    return res.status(400).json({ error: `Please watch the full ad. ${Math.ceil((required - elapsed) / 1000)}s remaining.` });
  }
  if (u.adsWatchedToday >= db.settings.dailyAdLimit) {
    delete u._pendingAd;
    return res.status(429).json({ error: 'Daily ad limit reached' });
  }
  // Cap daily earnings from ads
  const cap = (db.settings.dailyAdLimit || 50) * 30; // safety cap (30 pts per ad)
  if (u.dailyAdPointTotal >= cap) { delete u._pendingAd; return res.status(429).json({ error: 'Daily ad point cap reached' }); }
  u.adsWatchedToday++;
  const pts = u.premium ? 60 : 30;  // premium 2x
  u.dailyAdPointTotal += pts;
  u.lastAdClaimAt = now;
  delete u._pendingAd;
  addPoints(u, pts, 'ad');
  saveDB();
  res.json({ ok: true, points: pts, user: u });
});

// QUIZ: client submits which question index + answer, server picks daily questions and tracks which are answered
app.post('/api/earn/quiz/start', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  if (u.quizDoneToday >= (db.settings.quizPerDay || 5)) {
    return res.status(429).json({ error: 'Daily quiz limit reached' });
  }
  // Pick 5 questions for TODAY deterministically by day index
  const dayIdx = Math.floor(now / 86400000);
  const bank = db.settings.quizQuestions || [];
  if (bank.length < 5) return res.status(500).json({ error: 'Not enough quiz questions in bank' });
  // Shuffle by day (so same 5 questions all day, different each day)
  const startIdx = (dayIdx * 7) % bank.length;
  const todays = [];
  for (let i = 0; i < 5; i++) todays.push(bank[(startIdx + i) % bank.length]);
  // Exclude already-answered questions today
  const answered = new Set(u.quizAnsweredToday.map(x => x.qHash));
  const remaining = todays.filter((q, i) => !answered.has(dayIdx + ':' + ((startIdx + i) % bank.length)));
  if (remaining.length === 0) {
    return res.json({ ok: true, question: null, done: true, score: u.quizDoneToday });
  }
  // Take next un-answered
  const q = remaining[0];
  const realIdx = todays.indexOf(q);
  const qHash = dayIdx + ':' + ((startIdx + realIdx) % bank.length);
  res.json({
    ok: true,
    done: false,
    question: { q: q.q, opts: q.opts, hash: qHash },
    cooldown: db.settings.quizCooldownSeconds || 30,
    answeredToday: u.quizAnsweredToday.length,
    limit: db.settings.quizPerDay || 5
  });
});

app.post('/api/earn/quiz/answer', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  if (u.quizDoneToday >= (db.settings.quizPerDay || 5)) {
    return res.status(429).json({ error: 'Daily quiz limit reached' });
  }
  const { qHash, picked, startTime } = req.body;
  if (!qHash) return res.status(400).json({ error: 'Missing question hash' });
  // Per-question cooldown
  if (startTime && (now - startTime) < 2000) {
    return res.status(429).json({ error: 'Too fast. Take your time to read.' });
  }
  // Prevent answering the same question twice today
  if (u.quizAnsweredToday.find(x => x.qHash === qHash)) {
    return res.status(429).json({ error: 'You already answered this question today' });
  }
  // Find question from hash
  const [dayStr, idxStr] = qHash.split(':');
  const idx = parseInt(idxStr);
  const bank = db.settings.quizQuestions || [];
  const q = bank[idx];
  if (!q) return res.status(400).json({ error: 'Invalid question' });
  const correct = parseInt(picked) === q.a;
  u.quizDoneToday++;
  u.quizAnsweredToday.push({ qHash, t: now });
  const pts = correct ? (u.premium ? 4 : 2) : (u.premium ? 1 : 0); // 0 for wrong
  if (pts > 0) addPoints(u, pts, 'quiz');
  saveDB();
  res.json({ ok: true, correct, points: pts, user: u, correctAnswer: q.a });
});

app.post('/api/earn/spin', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  const cooldown = 6 * 3600 * 1000; // 6 hours
  if (now - u.spinLastAt < cooldown && !u.premium) return res.status(429).json({ error: 'Spin cooldown' });
  u.spinLastAt = now;
  const rewards = db.settings.spinRewards;
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  addPoints(u, reward, 'spin');
  saveDB();
  res.json({ ok: true, points: reward, user: u });
});

app.post('/api/earn/checkin', auth, (req, res) => {
  const u = req.user;
  const now = Date.now();
  const dayMs = 86400000;
  if (now - u.lastCheckin < dayMs) return res.status(429).json({ error: 'Already checked in' });
  u.checkinStreak = (u.checkinStreak || 0) + 1;
  const basePts = 5 + Math.min(u.checkinStreak, 30); // 5..35
  const pts = u.premium ? basePts * 2 : basePts;
  u.lastCheckin = now;
  addPoints(u, pts, 'checkin');
  saveDB();
  res.json({ ok: true, points: pts, streak: u.checkinStreak, user: u });
});

app.post('/api/earn/social', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  // Cooldown 12h per platform
  const platform = req.body.platform || 'unknown';
  if (!u.socialLast) u.socialLast = {};
  const last = u.socialLast[platform] || 0;
  if (now - last < 12 * 3600 * 1000) {
    return res.status(429).json({ error: `Already claimed for ${platform} in last 12h` });
  }
  const pts = u.premium ? 20 : 10;
  u.socialLast[platform] = now;
  addPoints(u, pts, 'social');
  saveDB();
  res.json({ ok: true, points: pts, user: u });
});

// OFFER (CPA): start token + claim
app.post('/api/earn/offer/start', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  // limit: 3 offers per day, min 30s wait between
  const offerCount = Object.keys(u.lastOfferClaimAt || {}).length;
  if (offerCount >= 3) return res.status(429).json({ error: 'Daily offer limit reached (3/day)' });
  const offerToken = crypto.randomBytes(16).toString('hex');
  u._pendingOffer = { token: offerToken, startedAt: now };
  saveDB();
  res.json({ ok: true, offerToken, startedAt: now, waitSeconds: db.settings.offerWaitSeconds || 30 });
});

app.post('/api/earn/offer/claim', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  const { offerToken } = req.body;
  const pending = u._pendingOffer;
  if (!pending || pending.token !== offerToken) {
    return res.status(400).json({ error: 'No offer in progress. Tap "Start Offer" again.' });
  }
  const required = (db.settings.offerWaitSeconds || 30) * 1000;
  const elapsed = now - pending.startedAt;
  if (elapsed < required) {
    return res.status(400).json({ error: `Verifying... ${Math.ceil((required - elapsed) / 1000)}s remaining. Keep the app open!` });
  }
  // limit per day
  const offerCount = Object.keys(u.lastOfferClaimAt || {}).length;
  if (offerCount >= 3) { delete u._pendingOffer; return res.status(429).json({ error: 'Daily offer limit reached' }); }
  const cap = 3 * 50;
  if ((u.dailyOfferPointTotal || 0) >= cap) { delete u._pendingOffer; return res.status(429).json({ error: 'Daily offer point cap reached' }); }
  const pts = 30;
  u.dailyOfferPointTotal = (u.dailyOfferPointTotal || 0) + pts;
  if (!u.lastOfferClaimAt) u.lastOfferClaimAt = {};
  u.lastOfferClaimAt[pending.token] = now;
  delete u._pendingOffer;
  addPoints(u, pts, 'offer');
  saveDB();
  res.json({ ok: true, points: pts, user: u });
});


// INSTALL GAME (real Play Store offers): start + claim
// Web apps can't verify installs, so we trust + cap daily to prevent farming
const INSTALL_DAILY_CAP = 5;     // max 5 installs per day per user
const INSTALL_WAIT_SECONDS = 0;  // NO wait (was 30s, too strict - users lost interest)
app.post('/api/earn/install/start', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  // daily cap
  if ((u.installsToday || 0) >= INSTALL_DAILY_CAP) {
    return res.status(429).json({ error: 'Daily install limit reached (' + INSTALL_DAILY_CAP + '/day). Try again tomorrow!' });
  }
  // already installed this game?
  const pkg = String(req.body.pkg || '');
  if (u.installedGames && u.installedGames.includes(pkg)) {
    return res.status(400).json({ error: 'You already installed this game' });
  }
  const installToken = crypto.randomBytes(16).toString('hex');
  u._pendingInstall = { token: installToken, startedAt: now, pkg };
  saveDB();
  res.json({ ok: true, installToken, startedAt: now, waitSeconds: INSTALL_WAIT_SECONDS });
});

app.post('/api/earn/install/claim', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  const now = Date.now();
  resetDailyCounters(u);
  // accept either installToken (new) or just pkg+name+pts (old/fallback)
  const { installToken, pkg, name, pts } = req.body;
  const pending = u._pendingInstall;
  // LENIENT: if no pending token, accept if start was called within last 10 min
  // (this fixes the "user installed but no points" problem when Play Store killed JS state)
  const allowLenient = installToken && pending && pending.token === installToken;
  const allowByStart = !installToken && pending && (now - pending.startedAt) < 10 * 60 * 1000;
  if (!allowLenient && !allowByStart) {
    // No state - require start
    return res.status(400).json({ error: 'Tap INSTALL first to start the offer' });
  }
  // daily cap
  if ((u.installsToday || 0) >= INSTALL_DAILY_CAP) {
    delete u._pendingInstall; saveDB();
    return res.status(429).json({ error: 'Daily install limit reached' });
  }
  // already installed?
  const usedPkg = (pending && pending.pkg) || pkg;
  if (u.installedGames && u.installedGames.includes(usedPkg)) {
    delete u._pendingInstall; saveDB();
    return res.status(400).json({ error: 'You already installed this game' });
  }
  // award points (100 default)
  const reward = Math.min(200, Math.max(10, parseInt(pts) || 100));
  u.installsToday = (u.installsToday || 0) + 1;
  if (!u.installedGames) u.installedGames = [];
  u.installedGames.push(usedPkg);
  delete u._pendingInstall;
  addPoints(u, reward, 'install:' + (name || usedPkg));
  saveDB();
  res.json({ ok: true, points: reward, user: u, installsToday: u.installsToday, installsLeft: Math.max(0, INSTALL_DAILY_CAP - u.installsToday) });
});

app.post('/api/earn/game', auth, (req, res) => {
  const u = req.user;
  const { score } = req.body;
  const s = Math.max(0, Math.min(1000, parseInt(score) || 0));
  const pts = Math.min(20, Math.floor(s / 50));
  if (pts === 0) return res.status(400).json({ error: 'Score too low' });
  addPoints(u, pts, 'game');
  saveDB();
  res.json({ ok: true, points: pts, user: u });
});

function addPoints(user, pts, source) {
  user.points += pts;
  user.totalPointsEarned += pts;
  user.xp += pts;
  user.level = 1 + Math.floor(user.xp / 100);
}

// ============ API: REDEEM ============
app.get('/api/redeem/status', auth, (req, res) => {
  const u = req.user;
  const s = db.settings;
  const eligible = u.points >= s.minPointsToRedeem;
  const cooldownMs = (u.premium ? s.premiumRedeemCooldownHours : s.freeRedeemCooldownHours) * 3600 * 1000;
  const nextRedeemAt = u.lastRedeem + cooldownMs;
  const canRedeem = eligible && Date.now() >= nextRedeemAt;
  res.json({
    eligible, canRedeem,
    points: u.points,
    minPoints: s.minPointsToRedeem,
    ucPerRedeem: s.ucPerRedeem,
    pointsPerUc: s.pointsPerUc,
    nextRedeemAt,
    cooldownRemaining: Math.max(0, nextRedeemAt - Date.now()),
    premium: u.premium,
    needsRating: !u.lastRatingSubmit || (Date.now() - u.lastRatingSubmit > 30 * 86400000)
  });
});

app.post('/api/redeem/rating', auth, (req, res) => {
  const { stars, feedback } = req.body;
  if (stars !== 5) return res.status(400).json({ error: '5-star rating required' });
  if (!feedback || feedback.length < 5) return res.status(400).json({ error: 'Please leave positive feedback' });
  req.user.lastRatingSubmit = Date.now();
  saveDB();
  res.json({ ok: true });
});

app.post('/api/redeem/request', auth, (req, res) => {
  const u = req.user;
  const s = db.settings;
  if (u.points < s.minPointsToRedeem) return res.status(400).json({ error: 'Not enough points' });
  const cooldownMs = (u.premium ? s.premiumRedeemCooldownHours : s.freeRedeemCooldownHours) * 3600 * 1000;
  if (Date.now() - u.lastRedeem < cooldownMs) return res.status(400).json({ error: 'Cooldown active' });
  if (!u.lastRatingSubmit || (Date.now() - u.lastRatingSubmit > 30 * 86400000)) {
    return res.status(400).json({ error: 'Rating required first' });
  }
  const { pubgId } = req.body;
  if (!pubgId || pubgId.length < 5) return res.status(400).json({ error: 'Valid PUBG ID required' });
  u.points -= s.minPointsToRedeem;
  u.lastRedeem = Date.now();
  u.redeemedCount = (u.redeemedCount || 0) + 1;
  const reqObj = {
    id: crypto.randomBytes(8).toString('hex'),
    deviceId: u.deviceId,
    username: u.username,
    pubgId,
    uc: s.ucPerRedeem,
    pointsDeducted: s.minPointsToRedeem,
    premium: u.premium,
    status: 'pending',
    createdAt: Date.now(),
    paidAt: null
  };
  db.redeemRequests.push(reqObj);
  saveDB();
  res.json({ ok: true, request: reqObj });
});

app.get('/api/leaderboard', (req, res) => {
  const top = Object.values(db.users)
    .filter(u => !u.banned)
    .sort((a, b) => b.totalPointsEarned - a.totalPointsEarned)
    .slice(0, 50)
    .map(u => ({ username: u.username, points: u.totalPointsEarned, level: u.level, premium: u.premium }));
  res.json({ leaderboard: top });
});

// ============ API: ADMIN ============

// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== db.settings.adminPassword) return res.status(403).json({ error: 'Wrong password' });
  res.json({ ok: true });
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const users = Object.values(db.users);
  res.json({
    totalUsers: users.length,
    activeUsers: users.filter(u => Date.now() - u.lastActive < 86400000).length,
    premiumUsers: users.filter(u => u.premium).length,
    totalPoints: users.reduce((s, u) => s + u.points, 0),
    totalRedeemed: db.redeemRequests.length,
    pendingRedeems: db.redeemRequests.filter(r => r.status === 'pending').length,
    totalUCPaid: db.redeemRequests.filter(r => r.status === 'paid').reduce((s, r) => s + r.uc, 0)
  });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  res.json({ users: Object.values(db.users).map(u => ({
    ...u,
    lastActive: new Date(u.lastActive).toISOString()
  })) });
});

app.get('/api/admin/redeems', adminAuth, (req, res) => {
  res.json({ redeems: db.redeemRequests.sort((a, b) => b.createdAt - a.createdAt) });
});


// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/redeem/update', adminAuth, (req, res) => {
  const { id, status } = req.body;
  const r = db.redeemRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  r.status = status;
  r.paidAt = status === 'paid' ? Date.now() : null;
  saveDB();
  res.json({ ok: true, request: r });
});


// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/user/update', adminAuth, (req, res) => {
  const { deviceId, points, premium, banned, pubgId } = req.body;
  const u = db.users[deviceId];
  if (!u) return res.status(404).json({ error: 'Not found' });
  if (typeof points === 'number') u.points = points;
  if (typeof premium === 'boolean') { u.premium = premium; u.premiumUntil = premium ? Date.now() + 30 * 86400000 : 0; }
  if (typeof banned === 'boolean') u.banned = banned;
  if (typeof pubgId === 'string') u.pubgId = pubgId;
  saveDB();
  res.json({ ok: true, user: u });
});


// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/settings', adminAuth, (req, res) => {
  const allowed = ['pointsPerUc','ucPerRedeem','minPointsToRedeem','freeRedeemCooldownHours',
    'premiumRedeemCooldownHours','dailyAdLimit','signupBonus','adsterraLink','monetagLink','offerWallLink',
    'adWatchSeconds','offerWaitSeconds','adCooldownSeconds','quizCooldownSeconds','quizPerDay',
    'ytLink','igLink','tgLink','whLink'];
  for (const k of allowed) if (k in req.body) db.settings[k] = req.body[k];
  saveDB();
  res.json({ ok: true, settings: publicSettings() });
});


// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/announce', adminAuth, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Empty' });
  db.settings.announcements.unshift({ id: crypto.randomBytes(4).toString('hex'), message, at: Date.now() });
  if (db.settings.announcements.length > 10) db.settings.announcements.length = 10;
  saveDB();
  res.json({ ok: true });
});


// ===== PREMIUM PAYMENT REQUESTS =====
app.post('/api/premium/payment', auth, (req, res) => {
  const u = req.user;
  if (u.banned) return res.status(403).json({ error: 'Banned' });
  if (u.premium) return res.status(400).json({ error: 'You already have Premium' });
  const { method, trxId, senderName, amount } = req.body;
  if (!method || !trxId || !senderName) return res.status(400).json({ error: 'Missing fields' });
  if (String(trxId).trim().length < 4) return res.status(400).json({ error: 'Invalid Transaction ID' });
  const validMethods = ['jazzcash','easypaisa','bank','card','usdt','paypal'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payment method' });
  if (!db.premiumRequests) db.premiumRequests = [];
  // prevent duplicate trxId
  if (db.premiumRequests.find(r => r.trxId === trxId.trim() && r.status === 'pending')) {
    return res.status(400).json({ error: 'This Transaction ID is already pending' });
  }
  const req2 = {
    id: crypto.randomBytes(8).toString('hex'),
    username: u.username,
    deviceId: u.deviceId,
    method, trxId: trxId.trim(), senderName: senderName.trim(),
    amount: parseInt(amount) || 250,
    status: 'pending',
    createdAt: Date.now()
  };
  db.premiumRequests.push(req2);
  saveDB();
  res.json({ ok: true, request: req2 });
});

app.get('/api/admin/premium', adminAuth, (req, res) => {
  res.json({ requests: db.premiumRequests || [] });
});

app.post('/api/admin/premium/update', adminAuth, (req, res) => {
  const { id, action } = req.body;
  if (!db.premiumRequests) return res.status(404).json({ error: 'No requests' });
  const r = db.premiumRequests.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (action === 'approve') {
    // find user by deviceId and set premium
    const u = db.users.find(x => x.deviceId === r.deviceId);
    if (u) {
      u.premium = true;
      u.premiumSince = Date.now();
      addPoints(u, 2000, 'premium-activation-bonus');
    }
    r.status = 'approved';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else if (action === 'reject') {
    r.status = 'rejected';
    r.resolvedAt = Date.now();
    saveDB();
    res.json({ ok: true });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.post('/api/admin/change-password', adminAuth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword !== db.settings.adminPassword) {
    return res.status(403).json({ error: 'Current password is wrong' });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  if (newPassword === oldPassword) {
    return res.status(400).json({ error: 'New password must be different' });
  }
  db.settings.adminPassword = newPassword;
  saveDB();
  console.log('🔐 Admin password changed');
  res.json({ ok: true });
});

// ============ START ============
app.listen(PORT, () => {
  console.log(`🎯 UC Bounty running on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
});
