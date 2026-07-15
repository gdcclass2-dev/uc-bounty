// ===== UC BOUNTY - FRONTEND (v2: anti-fraud + bigger quiz bank) =====

// ===== DEVICE FINGERPRINT (per device, not per user) =====
function getDeviceId() {
  let id = localStorage.getItem('ucb_deviceId');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ucb_deviceId', id);
  }
  return id;
}
function getFP() {
  const data = [
    navigator.userAgent, navigator.language, screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(), navigator.hardwareConcurrency || 0
  ].join('|');
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

// ===== STATE =====
let TOKEN = localStorage.getItem('ucb_token') || null;
let USER = null;
let SETTINGS = null;
let REFRESH_TIMER = null;
let SPIN_RESULT = 0;

const DEVICE_ID = getDeviceId();
const FP = getFP();

// ===== API =====
async function api(path, body = {}, needAuth = true) {
  const headers = { 'Content-Type': 'application/json', 'x-device-id': DEVICE_ID };
  if (needAuth && TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  try {
    const r = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
    // Server may send new token if we logged in via deviceId fallback
    const newTok = r.headers.get('x-new-token');
    if (newTok) {
      TOKEN = newTok;
      try { localStorage.setItem('ucb_token', newTok); } catch(e) {}
    }
    const j = await r.json();
    if (r.status === 401) { doLogout(); throw new Error('Session expired'); }
    if (!r.ok) throw new Error(j.error || 'API error');
    // Save token from response body too (fallback)
    if (j && j.token) {
      TOKEN = j.token;
      try { localStorage.setItem('ucb_token', j.token); } catch(e) {}
    }
    return j;
  } catch (e) {
    if (e.message.includes('fetch')) throw new Error('Network error. Check connection.');
    throw e;
  }
}
async function apiPost(path, body) { return api(path, body); }
async function apiGet(path) {
  const headers = { 'x-device-id': DEVICE_ID };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  try {
    const r = await fetch(path, { headers });
    // Save new token if server sent one (auto-login)
    const newTok = r.headers.get('x-new-token');
    if (newTok) {
      TOKEN = newTok;
      try { localStorage.setItem('ucb_token', newTok); } catch(e) {}
    }
    if (r.status === 401) { doLogout(); throw new Error('Session expired'); }
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'API error');
    // Save token from response body
    if (j && j.token) {
      TOKEN = j.token;
      try { localStorage.setItem('ucb_token', j.token); } catch(e) {}
    }
    return j;
  } catch (e) {
    if (e.message.includes('fetch')) throw new Error('Network error');
    throw e;
  }
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SPLASH → AUTH/APP =====
window.addEventListener('load', () => {
  setTimeout(async () => {
    // 1) If we have a token, try to use it
    if (TOKEN) {
      try {
        const j = await apiGet('/api/me');
        USER = j.user; SETTINGS = j.settings;
        initApp();
        return;
      } catch (e) { doLogout(); }
    }
    // 2) No token? Try AUTO-LOGIN with just deviceId (permanent login!)
    const ok = await tryAutoLogin();
    if (ok) return;
    // 3) No saved user on this device - show signup
    showScreen('auth');
  }, 1500);
});

// ===== AUTH =====
document.getElementById('authSubmit').addEventListener('click', async () => {
  const username = document.getElementById('authUsername').value.trim();
  const pubgId = document.getElementById('authPubgId').value.trim();
  const refCode = document.getElementById('authRef').value.trim();
  if (!username) return toast('Enter a username');
  try {
    const j = await api('/api/signup', { username, pubgId, deviceId: DEVICE_ID, fp: FP, refCode }, false);
    TOKEN = j.token; localStorage.setItem('ucb_token', TOKEN);
    USER = j.user;
    const me = await apiGet('/api/me');
    SETTINGS = me.settings;
    initApp();
    toast('🎯 Welcome, ' + USER.username + '! +' + SETTINGS.signupBonus + ' bonus');
  } catch (e) { toast('❌ ' + e.message); }
});

// PERMANENT LOGIN: If device already registered, auto-login on page load
async function tryAutoLogin() {
  if (TOKEN) return false;  // already have token, no need
  try {
    // Call /api/me with just deviceId header (no token)
    const r = await fetch('/api/me', { headers: { 'x-device-id': DEVICE_ID } });
    if (r.ok) {
      const j = await r.json();
      if (j.user) {
        TOKEN = j.token || '';  // server may send new token
        if (TOKEN) localStorage.setItem('ucb_token', TOKEN);
        USER = j.user;
        SETTINGS = j.settings;
        initApp();
        toast('👋 Welcome back, ' + USER.username + '!');
        sfxReward();
        return true;
      }
    }
  } catch (e) {}
  return false;
}
function doLogout() {
  TOKEN = null; USER = null;
  localStorage.removeItem('ucb_token');
  showScreen('auth');
}

// ===== APP INIT =====
function initApp() {
  showScreen('app');
  refreshUI();
  refreshAdRemaining();
  loadLeaderboard();
  setInterval(refreshCooldownBar, 1000);
}

// ===== UI REFRESH =====
function refreshUI() {
  if (!USER) return;
  document.getElementById('topPoints').textContent = formatNum(USER.points);
  document.getElementById('bigPoints').textContent = formatNum(USER.points);
  document.getElementById('walletPoints').textContent = formatNum(USER.points);
  const uc = Math.floor(USER.points / SETTINGS.pointsPerUc);
  document.getElementById('balUC').textContent = '= ' + uc + ' UC';
  document.getElementById('walletUC').textContent = '= ' + uc + ' UC';
  document.getElementById('levelBadge').textContent = 'LV ' + USER.level;
  document.getElementById('pUsername').textContent = USER.username;
  document.getElementById('pPubgId').textContent = USER.pubgId || '— not set —';
  document.getElementById('pubgUC').textContent = SETTINGS.ucPerRedeem;
  const pct = Math.min(100, (USER.points / SETTINGS.minPointsToRedeem) * 100);
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progPct').textContent = Math.floor(pct) + '%';
  document.getElementById('progToRedeem').textContent =
    formatNum(USER.points) + ' / ' + formatNum(SETTINGS.minPointsToRedeem) + ' to redeem';
  const locked = USER.points < SETTINGS.minPointsToRedeem;
  document.getElementById('redeemBtn').innerHTML = locked
    ? `<span class="lock-icon">🔒</span> REDEEM (need ${formatNum(SETTINGS.minPointsToRedeem - USER.points)} more)`
    : `<span>🎁</span> REDEEM ${SETTINGS.ucPerRedeem} UC`;
  document.getElementById('redeemBtn').disabled = locked;
  const avatar = document.getElementById('avatar');
  avatar.textContent = USER.premium ? '💎' : (USER.level >= 10 ? '🏆' : '🎮');
  document.getElementById('premBadge').classList.toggle('hidden', !USER.premium);
  const streak = USER.checkinStreak || 0;
  document.getElementById('checkinPts').textContent = '+' + (5 + Math.min(streak, 30)) + ' pts';
  if (SETTINGS.announcements && SETTINGS.announcements.length) {
    const a = SETTINGS.announcements[0];
    const bar = document.getElementById('annBar');
    bar.textContent = '📢 ' + a.message;
    bar.classList.remove('hidden');
  }
  refreshAdRemaining();
}
function refreshAdRemaining() {
  if (!USER || !SETTINGS) return;
  const used = USER.adsWatchedToday || 0;
  const left = SETTINGS.dailyAdLimit - used;
  const el = document.getElementById('adRem');
  if (el) el.textContent = used + '/' + SETTINGS.dailyAdLimit;
}
function formatNum(n) {
  n = Math.floor(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// ===== TABS =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById('tab-' + tab)?.classList.add('active');
  document.getElementById('app').scrollTop = 0;
  if (tab === 'wallet') refreshWallet();
}

// ===== WALLET =====
function refreshWallet() {
  const now = Date.now();
  const allTx = USER.tx || [];
  const today = allTx.filter(t => now - t.t < 86400000).reduce((s, t) => s + t.p, 0);
  const week = allTx.filter(t => now - t.t < 7 * 86400000).reduce((s, t) => s + t.p, 0);
  const all = allTx.reduce((s, t) => s + t.p, 0);
  document.getElementById('wsToday').textContent = formatNum(today || 0);
  document.getElementById('wsWeek').textContent = formatNum(week || 0);
  document.getElementById('wsAll').textContent = formatNum(all || USER.totalPointsEarned || 0);
  const list = document.getElementById('historyList');
  if (allTx.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px">No activity yet. Start earning!</p>';
  } else {
    list.innerHTML = allTx.slice(-20).reverse().map(t =>
      `<div class="hist-row"><span class="hist-source">${t.s}</span><span class="hist-pts">+${t.p} pts</span></div>`
    ).join('');
  }
}

// ===== SOUND EFFECTS (Web Audio API, no files needed) =====
let _audioCtx = null;
function _ctx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return null; }
  }
  return _audioCtx;
}
function playTone(freq, dur, type, vol) {
  if (window._sfxMuted) return;
  const c = _ctx(); if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch(e) {}
}
function sfxClick()  { playTone(800, 0.05, 'square', 0.10); }
function sfxCoin()   { playTone(1200, 0.08, 'sine', 0.18); setTimeout(() => playTone(1600, 0.10, 'sine', 0.18), 60); }
function sfxWin()    { [0,100,200,300].forEach((d,i) => setTimeout(() => playTone(600 + i*200, 0.15, 'triangle', 0.20), d)); }
function sfxLose()   { playTone(200, 0.20, 'sawtooth', 0.15); setTimeout(() => playTone(150, 0.25, 'sawtooth', 0.12), 100); }
function sfxError()  { playTone(300, 0.10, 'square', 0.15); setTimeout(() => playTone(200, 0.15, 'square', 0.12), 80); }
function sfxSuccess() { [0,80,160].forEach((d,i) => setTimeout(() => playTone(800 + i*200, 0.10, 'sine', 0.18), d)); }
function sfxLevelUp() { [0,100,200,300,400].forEach((d,i) => setTimeout(() => playTone(500 + i*150, 0.20, 'triangle', 0.22), d)); }

// NEW: Cheerful reward sound (when earning points)
function sfxReward() {
  // C-E-G major chord arpeggio (happy!)
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.18, 'sine', 0.20), i * 60);
  });
}

// NEW: PARTY celebration sound (for jackpots/big wins)
function sfxParty() {
  // Multi-instrument party fanfare!
  // Trumpet fanfare
  [0, 100, 200, 300, 400, 500, 600, 700].forEach((d, i) => {
    setTimeout(() => playTone(600 + i * 100, 0.20, 'triangle', 0.25), d);
  });
  // Air horn at the end
  setTimeout(() => playTone(440, 0.4, 'sawtooth', 0.18), 800);
  setTimeout(() => playTone(880, 0.3, 'sawtooth', 0.15), 900);
  // Cheering crowd (white noise burst)
  setTimeout(() => {
    if (window._sfxMuted) return;
    const c = _ctx(); if (!c) return;
    try {
      const bufferSize = c.sampleRate * 0.8;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      noise.connect(filter).connect(gain).connect(c.destination);
      noise.start();
      noise.stop(c.currentTime + 0.8);
    } catch(e) {}
  }, 1000);
}

// NEW: Spin wheel ticking sound (loops while wheel spins)
let _spinTickInterval = null;
function startSpinSound() {
  if (window._sfxMuted) return;
  // Tick-tick-tick accelerating then slowing down
  let tickCount = 0;
  const tick = () => {
    if (!window._sfxMuted) playTone(800 + (tickCount % 3) * 200, 0.04, 'square', 0.12);
    tickCount++;
    // Slow down over time (simulate wheel deceleration)
    let delay = 50 + Math.min(tickCount * 8, 200);
    if (tickCount > 30) {
      stopSpinSound();
      return;
    }
    _spinTickInterval = setTimeout(tick, delay);
  };
  tick();
}
function stopSpinSound() {
  if (_spinTickInterval) { clearTimeout(_spinTickInterval); _spinTickInterval = null; }
  // Final "ding" when wheel stops
  playTone(1200, 0.15, 'sine', 0.20);
}
function toggleSfx() {
  window._sfxMuted = !window._sfxMuted;
  try { localStorage.setItem('ucb_sfxMuted', window._sfxMuted ? '1' : '0'); } catch(e) {}
  const btn = document.getElementById('sfxToggle');
  if (btn) btn.textContent = window._sfxMuted ? '🔇' : '🔊';
  if (!window._sfxMuted) sfxClick();
}

// ===== MEGA GOAL POPUP =====
let _megaGoalShown = false;
async function checkMegaGoal() {
  if (!USER || !USER.points) return;
  if (USER.points < (SETTINGS.minPointsToRedeem || 6000)) return;  // not eligible yet
  // Show popup at most once per session
  if (_megaGoalShown) return;
  try {
    const r = await apiGet('/api/redeem/status');
    if (!r || !r.megaGoal) return;
    if (r.megaGoal.reached) {
      // 🎉 MEGA GOAL REACHED! Show celebration
      showMegaGoalReached(r.megaGoal);
    } else {
      // Show goal popup to motivate
      showMegaGoalModal(r.megaGoal, USER.points);
    }
  } catch(e) {}
}
function showMegaGoalModal(goal, currentPts) {
  _megaGoalShown = true;
  const pct = Math.min(100, Math.round((currentPts / goal.points) * 100));
  document.getElementById('megaGoalProgressBar').style.width = pct + '%';
  document.getElementById('megaGoalPct').textContent = pct + '%';
  document.getElementById('megaGoalPoints').textContent = currentPts.toLocaleString();
  document.getElementById('megaGoalModal').classList.remove('hidden');
  sfxLevelUp();
}
function showMegaGoalReached(goal) {
  _megaGoalShown = true;
  // Override modal with "REACHED!" message
  const m = document.getElementById('megaGoalModal');
  m.querySelector('.modal-box').innerHTML = `
    <div style="font-size:80px;margin:6px 0">🎉</div>
    <h2 style="color:#00ff88;margin:4px 0;font-size:24px">MEGA GOAL REACHED!</h2>
    <p style="color:#fff;font-size:15px;margin:8px 0">You earned <span style="color:#FFD700;font-weight:bold">${goal.points.toLocaleString()} pts</span>! 🏆</p>
    <div style="background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(0,255,136,0.2));border:2px solid #00ff88;border-radius:12px;padding:14px;margin:12px 0">
      <p style="color:#FFD700;font-size:11px;margin:0 0 6px 0;font-weight:bold">🎁 CLAIM YOUR REWARD</p>
      <p style="color:#fff;font-weight:bold;font-size:18px;margin:0 0 4px 0">PUBG X-Suit</p>
      <p style="color:#00ff88;font-weight:bold;font-size:20px;margin:0">OR 100,000 UC! 💎</p>
    </div>
    <p style="color:#aaa;font-size:12px;margin:8px 0">Contact support to claim your prize!</p>
    <button class="btn btn-gold btn-block" onclick="closeMegaGoalModal()">AWESOME!</button>
  `;
  m.classList.remove('hidden');
  if (typeof confettiBurst === 'function') confettiBurst();
  setTimeout(() => confettiBurst(), 500);
  setTimeout(() => confettiBurst(), 1000);
  sfxLevelUp();
}
function closeMegaGoalModal() {
  document.getElementById('megaGoalModal').classList.add('hidden');
  try { localStorage.setItem('ucb_megaGoalDismissed', String(Date.now())); } catch(e) {}
}

// ===== INVITE FRIENDS =====
async function openInvite() {
  document.getElementById('inviteModal').classList.remove('hidden');
  sfxClick();
  try {
    const r = await apiPost('/api/invite/code', {});
    if (r) {
      document.getElementById('inviteCodeText').textContent = r.code;
      document.getElementById('inviteLinkInput').value = r.link;
      document.getElementById('inviteCountText').textContent = r.inviteCount || 0;
      document.getElementById('inviteEarningsText').textContent = (r.inviteEarnings || 0).toLocaleString();
    }
    // Load history
    const lst = await apiGet('/api/invite/list');
    if (lst && lst.history) {
      let h = '';
      lst.history.slice(-5).reverse().forEach(item => {
        const ago = Math.floor((Date.now() - item.at) / 60000);
        const agoStr = ago < 60 ? ago + 'm ago' : Math.floor(ago / 60) + 'h ago';
        h += '<div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;margin:4px 0;display:flex;justify-content:space-between;align-items:center"><div style="color:#fff;font-size:11px">' + (item.username || 'User') + '<br><span style="color:#888;font-size:10px">' + agoStr + '</span></div><div style="color:' + (item.status === 'paid' ? '#00ff88' : '#FFD700') + ';font-size:11px;font-weight:bold">' + (item.status === 'paid' ? '+' + item.earned : 'pending') + '</div></div>';
      });
      if (!h) h = '<p style="color:#666;font-size:11px;text-align:center;margin:8px 0">No invites yet. Share your code!</p>';
      document.getElementById('inviteHistoryBox').innerHTML = h;
    }
  } catch(e) { toast('❌ ' + e.message); }
}
function copyInviteCode() {
  const code = document.getElementById('inviteCodeText').textContent;
  if (!code || code === 'LOADING...') return;
  navigator.clipboard.writeText(code).then(() => { toast('✅ Code copied!'); sfxCoin(); }).catch(() => { toast('Code: ' + code); });
}
function copyInviteLink() {
  const link = document.getElementById('inviteLinkInput').value;
  if (!link) return;
  navigator.clipboard.writeText(link).then(() => { toast('✅ Link copied!'); sfxCoin(); }).catch(() => { toast('Link: ' + link); });
}
function shareWhatsApp() {
  const code = document.getElementById('inviteCodeText').textContent;
  const link = document.getElementById('inviteLinkInput').value;
  const msg = encodeURIComponent('🎁 Join me on Free UC Earner and earn free UC for PUBG!\n\nUse my invite code: ' + code + '\nDownload: ' + link + '\n\nYou get 50 pts signup bonus + we both get 500 pts when you earn 100 pts! 💎');
  window.open('https://wa.me/?text=' + msg, '_blank');
  sfxCoin();
}
function shareTelegram() {
  const code = document.getElementById('inviteCodeText').textContent;
  const link = document.getElementById('inviteLinkInput').value;
  const msg = encodeURIComponent('🎁 Join Free UC Earner - earn UC for PUBG!\n\nInvite code: ' + code + '\n' + link);
  window.open('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + msg, '_blank');
  sfxCoin();
}
// Apply invite code on app init (from URL ?ref=CODE)
async function applyInviteCodeIfAny() {
  const url = new URL(window.location.href);
  let code = url.searchParams.get('ref');
  if (!code) {
    try { code = localStorage.getItem('ucb_pendingInvite'); } catch(e) {}
  }
  if (!code) return;
  // Save to localStorage so it persists across navigation
  try { localStorage.setItem('ucb_pendingInvite', code); } catch(e) {}
  try {
    const r = await apiPost('/api/invite/apply', { code: code });
    if (r && r.ok) {
      toast('🎁 ' + r.message);
      sfxReward();
      try { localStorage.removeItem('ucb_pendingInvite'); } catch(e) {}
    }
  } catch(e) { console.log('Invite apply:', e.message); }
}

// ===== DAILY CHALLENGE =====
let CHALLENGE = { adsToday: 0, target: 100, bonus: 1000, completed: false, progress: 0 };
async function refreshChallenge() {
  try {
    const j = await apiGet('/api/challenge/status');
    CHALLENGE = j;
    renderChallengeBar();
  } catch(e) {}
}
function renderChallengeBar() {
  // If you have a home-screen challenge widget, render it here
  // For now, just update data
}
function maybeShowChallengePopup(prevPoints) {
  const trigger = SETTINGS.challengePointsTrigger || 200;
  if (!USER || !USER.points) return;
  if (USER.points <= 0) return;
  // Don't show if completed today
  if (CHALLENGE.completed) return;
  // Show popup every 200 pts earned (cumulative)
  const milestone = Math.floor(USER.points / trigger) * trigger;
  const lastMilestone = Number(localStorage.getItem('ucb_lastMilestone') || 0);
  if (milestone <= lastMilestone) return;
  if (milestone < trigger) return;
  localStorage.setItem('ucb_lastMilestone', String(milestone));
  // Update modal data
  document.getElementById('challengeAdsCount').textContent = CHALLENGE.adsToday || 0;
  document.getElementById('challengeProgressBar').style.width = (CHALLENGE.progress || 0) + '%';
  document.getElementById('challengePct').textContent = (CHALLENGE.progress || 0) + '%';
  document.getElementById('challengeModal').classList.remove('hidden');
  sfxLevelUp();
}
function closeChallengeModal() {
  document.getElementById('challengeModal').classList.add('hidden');
}
function closeChallengeDoneModal() {
  document.getElementById('challengeDoneModal').classList.add('hidden');
  // Refresh confetti celebration
  if (typeof confettiBurst === 'function') confettiBurst();
  sfxWin();
}

// ===== TOP/BOTTOM BANNER ADS (Monetag rotation) =====
const BANNER_OFFERS = [
  { text: 'Tap to claim bonus rewards!', emoji: '🎁', url: 'https://omg10.com/4/11286726' },
  { text: '💎 Get 1000 free coins - tap here!', emoji: '💎', url: 'https://omg10.com/4/11286726' },
  { text: '🔥 Hot offer: 50% bonus today only!', emoji: '🔥', url: 'https://omg10.com/4/11286726' },
  { text: '🎮 Free game download - earn $5!', emoji: '🎮', url: 'https://omg10.com/4/11286726' },
  { text: '📱 Install this app → get $10!', emoji: '📱', url: 'https://omg10.com/4/11286726' },
  { text: '⚡ Limited time: Claim 500 pts!', emoji: '⚡', url: 'https://omg10.com/4/11286726' },
  { text: '🎁 Sponsored: Win iPhone 15!', emoji: '🎁', url: 'httpsomg10.com/4/11286726' }
];
let _bannerIdx = 0;
let _bottomBannerIdx = 0;
function clickTopBanner() {
  const offer = BANNER_OFFERS[_bannerIdx];
  try { window.open(offer.url, '_blank'); } catch(e) {}
  if (typeof sfxClick === 'function') sfxClick();
  // Monetag pays for click + time on page
  setTimeout(() => { try { window.open(offer.url, '_blank'); } catch(e) {} }, 2000);
}
function clickBottomBanner() {
  const offer = BANNER_OFFERS[_bottomBannerIdx];
  try { window.open(offer.url, '_blank'); } catch(e) {}
  if (typeof sfxClick === 'function') sfxClick();
}
function rotateTopBanner() {
  _bannerIdx = (_bannerIdx + 1) % BANNER_OFFERS.length;
  document.getElementById('topBannerText').textContent = BANNER_OFFERS[_bannerIdx].text;
  if (typeof sfxClick === 'function') sfxClick();
}
function hideTopBanner() {
  const b = document.getElementById('topBannerAd');
  if (b) b.style.display = 'none';
  try { localStorage.setItem('ucb_topBannerHidden', '1'); } catch(e) {}
}
function hideBottomBanner() {
  const b = document.getElementById('bottomBannerAd');
  if (b) b.style.display = 'none';
  try { localStorage.setItem('ucb_bottomBannerHidden', '1'); } catch(e) {}
}
function rotateBottomBanner() {
  _bottomBannerIdx = (_bottomBannerIdx + 1) % BANNER_OFFERS.length;
  const offer = BANNER_OFFERS[_bottomBannerIdx];
  document.getElementById('bottomBannerText').textContent = offer.text;
  if (typeof sfxClick === 'function') sfxClick();
}
// Auto-rotate top banner every 8 seconds
setInterval(() => {
  if (document.getElementById('topBannerAd').style.display !== 'none') rotateTopBanner();
}, 8000);
// Auto-rotate bottom banner every 10 seconds
setInterval(() => {
  rotateBottomBanner();
}, 10000);

// ===== CONFETTI BURST (used on rewards) =====
function confettiBurst() {
  if (typeof document === 'undefined') return;
  const colors = ['#FFD700', '#00E5FF', '#00ff88', '#ff6b6b', '#a78bfa', '#fbbf24'];
  const count = 60;
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden';
  document.body.appendChild(container);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 8;
    const x = 50 + (Math.random() - 0.5) * 60;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rot = Math.random() * 360;
    const dur = 1.5 + Math.random() * 1.2;
    const delay = Math.random() * 0.3;
    piece.style.cssText = `
      position:absolute;
      top:50%;left:${x}%;
      width:${size}px;height:${size * 0.4}px;
      background:${color};
      transform:translate(-50%,-50%) rotate(${rot}deg);
      border-radius:2px;
      animation:confettiFall ${dur}s ease-out ${delay}s forwards;
    `;
    container.appendChild(piece);
  }
  setTimeout(() => { try { container.remove(); } catch(e){} }, 3500);
}

// ===== EARN: AD (server-side timing) =====
let adState = { adToken: null, startedAt: 0, totalSeconds: 10 };
async function watchAd() {
  // 5-minute session check (no ads for first 5 min of using the app)
  const SESSION_DELAY_MS = 0;
  const sessionStart = window._ucSessionStart || (window._ucSessionStart = Date.now());
  if (Date.now() - sessionStart < SESSION_DELAY_MS) {
    const left = Math.ceil((SESSION_DELAY_MS - (Date.now() - sessionStart)) / 1000);
    const m = Math.floor(left / 60), s = left % 60;
    return toast('Ads unlock in ' + m + ':' + String(s).padStart(2,'0') + ' — keep using the app!');
  }
  if ((USER.adsWatchedToday || 0) >= SETTINGS.dailyAdLimit) return toast('Daily ad limit reached');
  // Ask server to start an ad session
  let j;
  try { j = await api('/api/earn/ad/start', {}); }
  catch (e) { return toast('❌ ' + e.message); }
  adState = { adToken: j.adToken, startedAt: j.startedAt, totalSeconds: j.waitSeconds };
  // Open ad modal
  const modal = document.getElementById('adModal');
  const content = document.getElementById('adContent');
  const fill = document.getElementById('adTimerFill');
  const claim = document.getElementById('adClaimBtn');
  modal.classList.remove('hidden');
  // Show prominent "tap back" hint that pulses to grab attention
  content.innerHTML = `
    <div style="font-size:60px;margin-bottom:10px;animation:bounce 1s infinite">🎬</div>
    <p style="color:#FFD700;font-weight:bold;font-size:18px;margin:6px 0">Ad opened in new tab!</p>
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #FFD700;border-radius:12px;padding:14px;margin:14px 0;animation:pulse 2s infinite">
      <p style="color:#FFD700;font-weight:bold;font-size:15px;margin:0 0 6px 0">👆 TAP THE BACK BUTTON</p>
      <p style="color:#fff;font-size:13px;margin:0">to return here &amp; claim <span style="color:#00ff88;font-weight:bold">+30 pts</span></p>
    </div>
    <p style="color:#00E5FF;font-size:12px;margin:6px 0">⏱️ Watch the ad (or skip) then come back here</p>
  `;

  // Open Monetag in new tab (ONCE per Watch Ad) - user returns and waits for our timer
  // Use the real Monetag on-click URL (omg10.com = direct ad, opens in new tab with actual ad)
  const _adUrl = (typeof SETTINGS !== 'undefined' && SETTINGS.monetagLink && SETTINGS.monetagLink.indexOf('otieu.com') === -1 && SETTINGS.monetagLink.indexOf('javascript') === -1) ? SETTINGS.monetagLink : 'https://omg10.com/4/11286726';
  try { window.open(_adUrl, '_blank'); } catch(e) {}
  fill.style.width = '0%';
  claim.classList.add('hidden');
  // Show "Verifying your view..." with spinner for 1s
  content.innerHTML = `
    <div style="font-size:50px;margin-bottom:8px">⏳</div>
    <p style="color:#FFD700;font-weight:bold">Verifying your view...</p>
    <p style="color:#888;font-size:12px;margin-top:8px">Almost done!</p>
  `;
  // Wait until user returns to app, then show CLAIM vs 2X buttons
  let ticking = false;
  let adCount = 0;  // 0 = first ad done, 1 = 2x pending
  // Show CLAIM / 2X buttons instead of auto-claim
  const showClaimUI = (mult) => {
    adState.multiplier = mult;
    const base = USER.premium ? 15 : 10;  // min possible
    const max = USER.premium ? 150 : 100;  // max possible (jackpot)
    const avg = USER.premium ? 30 : 20;   // average
    content.innerHTML = `
      <div style="font-size:60px;margin-bottom:6px;animation:bounce 1s infinite">🎁</div>
      <p style="color:#FFD700;font-weight:bold;font-size:18px;margin:4px 0">Ad verified!</p>
      <p style="color:#aaa;font-size:12px;margin:2px 0 12px 0">🎰 Win 10-100 pts randomly!</p>
      <button id="claimNormalBtn" class="btn btn-ghost btn-block" style="margin-bottom:8px" onclick="claimAd(1)">
        💰 CLAIM ${base}-${max} pts 🎲
      </button>
      <button id="claim2xBtn" class="btn btn-gold btn-block" style="background:linear-gradient(135deg,#ff6b6b,#FFD700);animation:pulse 2s infinite" onclick="claimAd2x()">
        🔥 WATCH ANOTHER AD → 2X (up to ${max * 2} pts!) 💎
      </button>
    `;
    fill.style.width = '100%';
  };
  const tick = setInterval(() => {
    if (!ticking) return;
    // Just keep fill at 100% during choice phase
  }, 100);
  // Show claim buttons INSTANTLY when user returns from new tab (no timer)
  const onVis = () => {
    if (document.visibilityState === 'visible' && !ticking) {
      ticking = true;
      fill.style.width = '100%';
      showClaimUI(1);
    }
  };
  document.addEventListener('visibilitychange', onVis);
  adState._visHandler = onVis;
  adState.interval = tick;
}
async function watchAdLong() {
  // For long ad: still same anti-fraud flow, just different reward
  return watchAd();
}
async function claimAd(mult) {
  if (adState.interval) clearInterval(adState.interval);
  if (adState._visHandler) document.removeEventListener('visibilitychange', adState._visHandler);
  if (adState._claimTimeout) clearTimeout(adState._claimTimeout);
  closeModal('adModal');
  const prevPoints = USER ? USER.points : 0;
  try {
    const j = await api('/api/earn/ad/claim', { adToken: adState.adToken, multiplier: mult || 1 });
    USER = j.user; refreshUI();
    const label = j.isJackpot ? '🎰 JACKPOT!' : ('Watched ad' + (mult > 1 ? ' (2X)' : ''));
    pushTx(label, j.points);
    toast('+' + j.points + ' pts' + (mult > 1 ? ' (2X!)' : '') + (j.isJackpot ? ' 🎰💎' : '') + '!');
    sfxReward();
    // 🎉 Confetti + sound celebration!
    if (typeof confettiBurst === 'function') confettiBurst();
    sfxCoin();
    if (j.isJackpot || j.points >= 50) {
      // 🎉 PARTY CELEBRATION for big wins!
      setTimeout(() => sfxParty(), 100);
      setTimeout(() => confettiBurst(), 400);
      setTimeout(() => confettiBurst(), 800);
      setTimeout(() => confettiBurst(), 1200);
    } else {
      // Normal win: cheerful reward sound
      setTimeout(() => sfxReward(), 100);
      if (mult > 1) setTimeout(() => confettiBurst(), 400);
    }
    // Refresh challenge + show popup if earned 200+ pts
    refreshChallenge().then(() => {
      maybeShowChallengePopup(prevPoints);
      if (CHALLENGE.completed && CHALLENGE.progress === 100 && !CHALLENGE._shownDone) {
        CHALLENGE._shownDone = true;
        setTimeout(() => {
          document.getElementById('challengeDoneModal').classList.remove('hidden');
          if (typeof confettiBurst === 'function') confettiBurst();
          sfxLevelUp();
          setTimeout(() => confettiBurst(), 600);
          setTimeout(() => confettiBurst(), 1200);
        }, 1500);
      }
    });
  } catch (e) { toast('❌ ' + e.message); sfxError(); }
  adState = { adToken: null, startedAt: 0 };
}

async function claimAd2x() {
  // User chose 2X: open another ad first, then claim 2x
  if (adState._claimTimeout) clearTimeout(adState._claimTimeout);
  // Disable the 2x button to prevent double-click
  const btn2x = document.getElementById('claim2xBtn');
  const btnN = document.getElementById('claimNormalBtn');
  if (btn2x) { btn2x.disabled = true; btn2x.textContent = '⏳ Opening ad...'; }
  if (btnN) btnN.disabled = true;
  // Open another ad in new tab
  const _adUrl = (typeof SETTINGS !== 'undefined' && SETTINGS.monetagLink && SETTINGS.monetagLink.indexOf('otieu.com') === -1 && SETTINGS.monetagLink.indexOf('javascript') === -1) ? SETTINGS.monetagLink : 'https://omg10.com/4/11286726';
  try { window.open(_adUrl, '_blank'); } catch(e) {}
  // Show "watch 2nd ad" hint
  const content = document.getElementById('adContent');
  content.innerHTML = `
    <div style="font-size:60px;margin-bottom:6px;animation:bounce 1s infinite">🔥</div>
    <p style="color:#FFD700;font-weight:bold;font-size:18px;margin:4px 0">2X BONUS AD OPENED!</p>
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #ff6b6b;border-radius:12px;padding:14px;margin:14px 0;animation:pulse 2s infinite">
      <p style="color:#ff6b6b;font-weight:bold;font-size:15px;margin:0 0 6px 0">👆 TAP THE BACK BUTTON</p>
      <p style="color:#fff;font-size:13px;margin:0">to claim your <span style="color:#00ff88;font-weight:bold">2X (up to ${(USER.premium ? 150 : 100)} pts) 💎</span></p>
    </div>
    <p style="color:#00E5FF;font-size:12px;margin:6px 0">⏱️ Watch the 2nd ad (or skip) then come back</p>
  `;
  // Wait for user to return, then claim 2x
  const onVis2 = () => {
    if (document.visibilityState === 'visible') {
      document.removeEventListener('visibilitychange', onVis2);
      // Instant 2X claim (no timer)
      claimAd(2);
    }
  };
  document.addEventListener('visibilitychange', onVis2);
  adState._visHandler2 = onVis2;
}

// ===== EARN: SPIN =====
function doSpin() {
  document.getElementById('spinModal').classList.remove('hidden');
  updateSpinCounter();
}
function updateSpinCounter() {
  const max = (typeof USER !== 'undefined' && USER.premium) ? 10 : (SETTINGS.spinsPerDay || 3);
  const used = (typeof USER !== 'undefined' && USER.spinsToday) || 0;
  const left = Math.max(0, max - used);
  const el = document.getElementById('spinCounter');
  if (el) {
    el.textContent = '🎰 Spins left: ' + left + '/' + max + (USER && USER.premium ? ' (PREMIUM)' : '');
    el.style.color = left === 0 ? '#ff6b6b' : '#FFD700';
  }
  const btn = document.getElementById('spinGo');
  if (btn) {
    btn.disabled = left === 0;
    btn.textContent = left === 0 ? 'NO SPINS LEFT' : 'SPIN NOW';
  }
}
async function spinNow() {
  const btn = document.getElementById('spinGo');
  btn.disabled = true;
  try {
    const j = await api('/api/earn/spin', {});
    SPIN_RESULT = j.points;
    USER = j.user;
    // Use the 9 wheel segments: 10, 15, 20, 30, 50, 75, 100, 200, jackpot(500)
    const wheelValues = [10, 15, 20, 30, 50, 75, 100, 200, 500];
    // Find closest matching segment
    let idx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < wheelValues.length; i++) {
      const diff = Math.abs(wheelValues[i] - SPIN_RESULT);
      if (diff < minDiff) { minDiff = diff; idx = i; }
    }
    const segs = wheelValues.length;
    // Reset + spin: ensure each spin rotates (use cumulative rotation)
    const baseRot = window._lastSpinRot || 0;
    const newRot = baseRot + 360 * 6 + (360 - idx * (360 / segs) - (360 / segs) / 2);
    window._lastSpinRot = newRot % 360;
    const wheel = document.getElementById('wheel');
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.24, 1)';
    wheel.style.transform = `rotate(${newRot}deg)`;
    // Play spinning sound (ticking)
    if (typeof startSpinSound === 'function') startSpinSound();
    setTimeout(() => {
      if (typeof stopSpinSound === 'function') stopSpinSound();
      if (j.isJackpot || SPIN_RESULT >= 100) {
        // 🎉 PARTY CELEBRATION for big wins!
        if (typeof sfxParty === 'function') sfxParty();
        toast('🎰 JACKPOT! +' + SPIN_RESULT + ' pts! 💎');
        if (typeof confettiBurst === 'function') {
          confettiBurst();
          setTimeout(() => confettiBurst(), 400);
          setTimeout(() => confettiBurst(), 800);
          setTimeout(() => confettiBurst(), 1200);
        }
      } else {
        // Normal win: cheerful reward sound
        if (typeof sfxReward === 'function') sfxReward();
        toast('🎰 +' + SPIN_RESULT + ' pts!');
      }
      pushTx(j.isJackpot || SPIN_RESULT >= 100 ? '🎰 SPIN JACKPOT!' : 'Lucky spin', SPIN_RESULT);
      refreshUI();
      if (j.spinsLeft !== undefined) {
        USER.spinsToday = (SETTINGS.spinsPerDay || 3) - j.spinsLeft;
      }
      updateSpinCounter();
      btn.disabled = false;
      closeModal('spinModal');
    }, 4200);
  } catch (e) {
    sfxError();
    toast('❌ ' + e.message);
    btn.disabled = false;
  }
}

// ===== EARN: QUIZ (one question at a time, server-validated) =====
let quizState = { score: 0, total: 0, currentHash: null, currentQ: null, startTime: 0, locked: false, answered: 0 };
async function openQuiz() {
  const limit = SETTINGS.quizPerDay || 5;
  if ((USER.quizDoneToday || 0) >= limit) return toast('❌ Quiz limit reached (' + limit + '/day)');
  // Refresh settings (get fresh question bank)
  const me = await apiGet('/api/me');
  SETTINGS = me.settings;
  quizState = { score: 0, total: 0, currentHash: null, currentQ: null, startTime: 0, locked: false, answered: 0 };
  document.getElementById('quizModal').classList.remove('hidden');
  await loadNextQuestion();
}
async function loadNextQuestion() {
  const limit = SETTINGS.quizPerDay || 5;
  document.getElementById('quizLimit').textContent = (USER.quizDoneToday || 0) + '/' + limit;
  document.getElementById('quizScore').textContent = 'Score: ' + quizState.score;
  let j;
  try { j = await api('/api/earn/quiz/start', {}); }
  catch (e) { toast('❌ ' + e.message); return finishQuiz(); }
  if (j.done || !j.question) {
    toast('✅ No more questions today. Come back tomorrow!');
    return finishQuiz();
  }
  quizState.currentHash = j.question.hash;
  quizState.currentQ = j.question;
  quizState.startTime = Date.now();
  quizState.locked = false;
  // Show question
  document.getElementById('quizQ').textContent = j.question.q;
  const opts = document.getElementById('quizOpts');
  opts.innerHTML = j.question.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${o}</button>`).join('');
  opts.querySelectorAll('.quiz-opt').forEach(b => {
    b.addEventListener('click', () => onQuizAnswer(parseInt(b.dataset.i), b));
  });
}
async function onQuizAnswer(picked, btn) {
  if (quizState.locked) return;
  quizState.locked = true;
  // Disable buttons immediately
  document.querySelectorAll('#quizOpts .quiz-opt').forEach(b => { b.style.pointerEvents = 'none'; });
  try {
    const j = await api('/api/earn/quiz/answer', {
      qHash: quizState.currentHash,
      picked,
      startTime: quizState.startTime
    });
    // Show correct/wrong
    const allBtns = document.querySelectorAll('#quizOpts .quiz-opt');
    allBtns.forEach((b, i) => {
      if (i === j.correctAnswer) b.classList.add('correct');
      else if (i === picked && !j.correct) b.classList.add('wrong');
    });
    if (j.correct) {
      quizState.score++;
      sfxSuccess();
      toast('✅ Correct! +' + j.points + ' pts');
    } else {
      sfxLose();
      toast('❌ Wrong. +' + j.points + ' pts');
    }
    USER = j.user;
    refreshUI();
    setTimeout(() => loadNextQuestion(), 1500);
  } catch (e) {
    sfxError();
    toast('❌ ' + e.message);
    setTimeout(() => loadNextQuestion(), 1500);
  }
}
async function finishQuiz() {
  closeModal('quizModal');
  pushTx('Daily quiz (' + quizState.score + ' correct)', quizState.score * 2);
  sfxLevelUp();
  toast('🧠 Quiz done! ' + quizState.score + ' correct today.');
}

// ===== EARN: TAP GAME =====
let gameState = { score: 0, time: 10, timer: null, running: false };
function openGame() {
  gameState = { score: 0, time: 10, timer: null, running: false };
  document.getElementById('gameScore').textContent = '0';
  document.getElementById('gameTimer').textContent = '10';
  document.getElementById('gameTarget').disabled = false;
  document.getElementById('gameModal').classList.remove('hidden');
}
document.getElementById('gameTarget').addEventListener('click', () => {
  if (!gameState.running) {
    gameState.running = true;
    gameState.timer = setInterval(() => {
      gameState.time--;
      document.getElementById('gameTimer').textContent = gameState.time;
      if (gameState.time <= 0) endGame();
    }, 1000);
  }
  gameState.score++;
  document.getElementById('gameScore').textContent = gameState.score;
});
async function endGame() {
  clearInterval(gameState.timer);
  document.getElementById('gameTarget').disabled = true;
  try {
    const j = await api('/api/earn/game', { score: gameState.score });
    USER = j.user;
    pushTx('Tap game (' + gameState.score + ')', j.points);
    refreshUI();
    sfxReward();
    toast('🎮 +' + j.points + ' pts!');
  } catch (e) { toast('❌ ' + e.message); }
  setTimeout(() => closeModal('gameModal'), 800);
}

// ===== EARN: CHECK-IN =====
async function checkin() {
  try {
    const j = await api('/api/earn/checkin', {});
    USER = j.user;
    pushTx('Daily check-in (streak ' + j.streak + ')', j.points);
    refreshUI();
    sfxReward();
    toast('🔥 +' + j.points + ' pts! (Streak: ' + j.streak + ')');
  } catch (e) { toast('❌ ' + e.message); }
}

// ===== EARN: OFFER (CPA) - server-side timing =====
let offerState = { offerToken: null, startedAt: 0, totalSeconds: 30, interval: null };
async function openOffer(id) {
  let j;
  try { j = await api('/api/earn/offer/start', {}); }
  catch (e) { return toast('❌ ' + e.message); }
  offerState = { offerToken: j.offerToken, startedAt: j.startedAt, totalSeconds: j.waitSeconds, interval: null };
  // Open offerwall link
  if (SETTINGS.offerWallLink && SETTINGS.offerWallLink.includes('http')) {
    window.open(SETTINGS.offerWallLink, '_blank');
  } else {
    window.open('https://www.profitabledisplaynetwork.com/u9dq9z4x?key=YOUR_KEY_HERE', '_blank');
  }
  // Show "verifying" modal
  document.getElementById('offerWaitTotal').textContent = j.waitSeconds;
  document.getElementById('offerWaitLeft').textContent = j.waitSeconds;
  document.getElementById('offerClaimBtn').classList.add('hidden');
  document.getElementById('offerWaitFill').style.width = '0%';
  document.getElementById('offerModal').classList.remove('hidden');
  const start = Date.now();
  const total = j.waitSeconds * 1000;
  offerState.interval = setInterval(() => {
    const e = Date.now() - start;
    const pct = Math.min(100, (e / total) * 100);
    const left = Math.max(0, Math.ceil((total - e) / 1000));
    document.getElementById('offerWaitFill').style.width = pct + '%';
    document.getElementById('offerWaitLeft').textContent = left;
    if (e >= total) {
      clearInterval(offerState.interval);
      document.getElementById('offerClaimBtn').classList.remove('hidden');
    }
  }, 250);
}
async function claimOffer() {
  if (offerState.interval) clearInterval(offerState.interval);
  closeModal('offerModal');
  try {
    const j = await api('/api/earn/offer/claim', { offerToken: offerState.offerToken });
    USER = j.user;
    pushTx('Completed offer', j.points);
    refreshUI();
    toast('✅ +' + j.points + ' pts for completing the offer!');
  } catch (e) { toast('❌ ' + e.message); }
  offerState = { offerToken: null, startedAt: 0 };
}

// ===== EARN: SOCIAL =====
async function doSocial(type) {
  // Prefer admin-configured links from settings, fall back to defaults
  const links = {
    yt: SETTINGS.ytLink || 'https://youtube.com/@ucbounty',
    ig: SETTINGS.igLink || 'https://instagram.com/ucbounty',
    tg: SETTINGS.tgLink || 'https://t.me/ucbounty',
    wh: SETTINGS.whLink || 'https://whatsapp.com/channel/ucbounty'
  };
  window.open(links[type], '_blank');
  setTimeout(async () => {
    try {
      const j = await api('/api/earn/social', { platform: type });
      USER = j.user;
      pushTx('Social: ' + type, j.points);
      refreshUI();
      toast('✅ +' + j.points + ' pts!');
    } catch (e) { toast('Not confirmed yet. Try again after following.'); }
  }, 3000);
}

// ===== REDEEM FLOW =====
async function openRedeem() {
  if (USER.points < SETTINGS.minPointsToRedeem) {
    return toast('❌ Need ' + formatNum(SETTINGS.minPointsToRedeem - USER.points) + ' more points');
  }
  try {
    const j = await apiGet('/api/redeem/status');
    if (!j.canRedeem) {
      if (j.cooldownRemaining > 0) {
        startCooldownCountdown(j.cooldownRemaining);
        document.getElementById('cooldownModal').classList.remove('hidden');
        return;
      }
    }
    if (j.needsRating) {
      openRating();
    } else {
      openRedeemAd();
    }
  } catch (e) { toast('❌ ' + e.message); }
}

// ===== REDEEM AD (one ad before PUBG ID) =====
function openRedeemAd() {
  // 5-min session check
  const SESSION_DELAY_MS = 0;
  const sessionStart = window._ucSessionStart || (window._ucSessionStart = Date.now());
  if (Date.now() - sessionStart < SESSION_DELAY_MS) {
    const left = Math.ceil((SESSION_DELAY_MS - (Date.now() - sessionStart)) / 1000);
    const m = Math.floor(left / 60), s = left % 60;
    return toast('Ads unlock in ' + m + ':' + String(s).padStart(2,'0'));
  }
  document.getElementById('redeemAdUC').textContent = SETTINGS.ucPerRedeem;
  document.getElementById('redeemAdModal').classList.remove('hidden');
}
function claimRedeemAd() {
  closeModal('redeemAdModal');
  openPubgModal();
}

// ===== RATING =====
let pickedStars = 0;
function openRating() {
  pickedStars = 0;
  document.querySelectorAll('#starsRow .star').forEach(s => {
    s.classList.remove('active');
    s.textContent = '☆';
  });
  document.getElementById('ratingText').value = '';
  document.getElementById('ratingModal').classList.remove('hidden');
}
document.querySelectorAll('#starsRow .star').forEach(s => {
  s.addEventListener('click', () => {
    pickedStars = parseInt(s.dataset.v);
    document.querySelectorAll('#starsRow .star').forEach((st, i) => {
      if (i < pickedStars) { st.classList.add('active'); st.textContent = '★'; }
      else { st.classList.remove('active'); st.textContent = '☆'; }
    });
  });
});
async function submitRating() {
  const txt = document.getElementById('ratingText').value.trim();
  if (pickedStars !== 5) return toast('❌ 5-star rating required');
  if (txt.length < 5) return toast('❌ Please leave positive feedback');
  try {
    await api('/api/redeem/rating', { stars: pickedStars, feedback: txt });
    closeModal('ratingModal');
    const j = await apiGet('/api/redeem/status');
    if (j.cooldownRemaining > 0 && !USER.premium) {
      startCooldownCountdown(j.cooldownRemaining);
      document.getElementById('cooldownModal').classList.remove('hidden');
    } else {
      openPubgModal();
    }
  } catch (e) { toast('❌ ' + e.message); }
}

// ===== COOLDOWN COUNTDOWN =====
let cdInterval = null;
function startCooldownCountdown(ms) {
  const el = document.getElementById('cdClock');
  function tick() {
    apiGet('/api/redeem/status').then(j => {
      let s = Math.floor(j.cooldownRemaining / 1000);
      if (s <= 0) { clearInterval(cdInterval); closeModal('cooldownModal'); openPubgModal(); return; }
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      el.textContent = `${h}:${m}:${sec}`;
    });
  }
  tick();
  cdInterval = setInterval(tick, 1000);
}
function refreshCooldownBar() {
  if (!USER) return;
  if (Date.now() - (window._lastRefresh || 0) > 30000) {
    window._lastRefresh = Date.now();
    apiGet('/api/me').then(j => { USER = j.user; SETTINGS = j.settings; refreshUI(); }).catch(() => {});
  }
}

// ===== PUBG ID =====
function openPubgModal() {
  document.getElementById('pubgInput').value = USER.pubgId || '';
  document.getElementById('pubgModal').classList.remove('hidden');
}
async function submitRedeem() {
  const pubgId = document.getElementById('pubgInput').value.trim();
  if (!pubgId) return toast('❌ Enter your PUBG ID');
  try {
    const j = await api('/api/redeem/request', { pubgId });
    const me = await apiGet('/api/me');
    USER = me.user; SETTINGS = me.settings;
    USER.pubgId = pubgId;
    refreshUI();
    closeModal('pubgModal');
    document.getElementById('successMsg').textContent =
      'Your request for ' + SETTINGS.ucPerRedeem + ' UC has been submitted! 🎮 Your UC will be sent to your PUBG account (ID: ' + pubgId + ') within 7 days. Thank you for using UC BOUNTY!';
    document.getElementById('successModal').classList.remove('hidden');
  } catch (e) { toast('❌ ' + e.message); }
}

// ===== PREMIUM =====
function openPremium() {
  document.getElementById('premModal').classList.remove('hidden');
}
let _selectedPayMethod = 'jazzcash';
function selectPayMethod(m, btn) {
  _selectedPayMethod = m;
  document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const details = document.getElementById('payDetails');
  const map = {
    jazzcash:   { title: '📱 JazzCash',   number: '03470964126',  name: 'Free UC Earner' },
    easypaisa:  { title: '📱 Easypaisa',  number: '03470964126',  name: 'Free UC Earner' },
    bank:       { title: '🏦 Bank Transfer', number: 'Contact admin', name: 'Free UC Earner' },
    card:       { title: '💳 Card / Stripe', number: 'Secure checkout (coming soon)', name: 'Card holder' },
    usdt:       { title: '💎 USDT (TRC20)', number: 'Contact admin on WhatsApp', name: 'Wallet address' },
    paypal:     { title: '🅿️ PayPal',     number: 'Coming soon', name: 'PayPal email' }
  };
  const d = map[m];
  details.innerHTML = '<div class="pay-info">' +
    '<h4>' + d.title + '</h4>' +
    '<p>Send <b>PKR 250</b> (≈ $1) to:</p>' +
    '<div class="pay-number">' + d.number + '</div>' +
    '<p class="hint">Then enter the Transaction ID (trx id) / reference number below</p>' +
    '</div>';
}

async function submitPremiumPayment() {
  const trx = (document.getElementById('premiumTrxId') || {}).value || '';
  const sender = (document.getElementById('premiumSenderName') || {}).value || '';
  if (!trx || trx.length < 4) return toast('⚠️ Enter Transaction ID');
  if (!sender) return toast('⚠️ Enter your name');
  try {
    const j = await api('/api/premium/payment', {
      method: _selectedPayMethod, trxId: trx.trim(), senderName: sender.trim(), amount: 250
    });
    toast('✅ Payment submitted! Admin will verify within 24h.');
    closeModal('payModal');
    if (j && j.request) pushTx('Premium: pending', 0);
  } catch(e) {
    toast('❌ ' + (e.message || 'Failed to submit'));
  }
}

function buyPremium() {
  closeModal('premModal');
  _selectedPayMethod = 'jazzcash';
  document.getElementById('payModal').classList.remove('hidden');
  setTimeout(() => selectPayMethod('jazzcash', document.querySelector(".pay-method[data-method='jazzcash']")), 100);
}

// ===== REFERRAL =====
function openReferral() {
  const code = USER.username.toLowerCase().slice(0, 6) + USER.deviceId.slice(-4);
  USER.referralCode = code;
  const url = location.origin + '?ref=' + code;
  if (navigator.share) {
    navigator.share({ title: 'Free UC Earner', text: 'Join me on Free UC Earner and earn real UC!', url });
  } else {
    navigator.clipboard.writeText(url);
    toast('📋 Link copied: ' + url);
  }
}
function openHistory() { switchTab('wallet'); }
function openSupport() { window.open('https://wa.me/?text=Hi%2C%20I%20need%20help%20with%20UC%20Bounty', '_blank'); }

// ===== LEADERBOARD =====
async function loadLeaderboard() {
  try {
    const j = await apiGet('/api/leaderboard');
    const el = document.getElementById('leaderboard');
    el.innerHTML = j.leaderboard.map((u, i) =>
      `<div class="lb-row">
        <span class="lb-rank ${i < 3 ? 'gold' : ''}">#${i + 1}</span>
        <span class="lb-name">${u.premium ? '💎 ' : ''}${escape(u.username)}</span>
        <span class="lb-pts">${formatNum(u.points)} pts</span>
      </div>`
    ).join('');
  } catch (e) {}
}
function escape(s) { return String(s).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c])); }

// ===== TX LOG (local) =====
function pushTx(source, pts) {
  if (!USER.tx) USER.tx = [];
  USER.tx.push({ s: source, p: pts, t: Date.now() });
  if (USER.tx.length > 100) USER.tx = USER.tx.slice(-100);
}

// ===== MODAL =====
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); });
});

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => t.classList.add('hidden'), 3000);
}


// ===== IN-FEED AD CLICK =====
function clickInFeedAd() {
  const url = (typeof SETTINGS !== 'undefined' && SETTINGS.monetagLink) ? SETTINGS.monetagLink : 'https://omg10.com/4/11286726';
  window.open(url, '_blank', 'noopener');
  toast('💎 Opening offer...');
}

// ===== STOP SOUNDS WHEN APP GOES TO BACKGROUND =====
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Stop any pending spin sounds
    if (typeof stopSpinSound === 'function') stopSpinSound();
    // Close AudioContext to silence all tones
    try { if (_audioCtx) { _audioCtx.close(); _audioCtx = null; } } catch(e) {}
    // Clear all pending setTimeout for sounds
    try { clearTimeout(_spinTickInterval); _spinTickInterval = null; } catch(e) {}
  }
});
// Also stop sounds on page hide
window.addEventListener('pagehide', () => {
  try { if (_audioCtx) { _audioCtx.close(); _audioCtx = null; } } catch(e) {}
  try { clearTimeout(_spinTickInterval); _spinTickInterval = null; } catch(e) {}
});
// Stop sounds on blur
window.addEventListener('blur', () => {
  try { if (_audioCtx) { _audioCtx.close(); _audioCtx = null; } } catch(e) {}
});
