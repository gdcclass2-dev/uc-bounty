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
    const j = await r.json();
    if (r.status === 401) { doLogout(); throw new Error('Session expired'); }
    if (!r.ok) throw new Error(j.error || 'API error');
    return j;
  } catch (e) {
    if (e.message.includes('fetch')) throw new Error('Network error. Check connection.');
    throw e;
  }
}
async function apiGet(path) {
  const headers = { 'x-device-id': DEVICE_ID };
  if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
  const r = await fetch(path, { headers });
  return r.json();
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SPLASH → AUTH/APP =====
window.addEventListener('load', () => {
  setTimeout(async () => {
    if (TOKEN) {
      try {
        const j = await apiGet('/api/me');
        USER = j.user; SETTINGS = j.settings;
        initApp();
        return;
      } catch (e) { doLogout(); }
    }
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
  content.innerHTML = '<div style="font-size:50px;margin-bottom:8px">🎬</div><p style="color:#FFD700;font-weight:bold">Sponsor ad opened in new tab</p><p style="color:#00E5FF;font-size:13px">Watch it fully, return here and wait for the timer.</p>';

  // Open Monetag in new tab (ONCE per Watch Ad) - user returns and waits for our timer
  try { window.open('https://al5sm.com/click', '_blank'); } catch(e) {}
  fill.style.width = '0%';
  claim.classList.add('hidden');
  let elapsed = 0;
  const tick = setInterval(() => {
    elapsed += 0.1;
    fill.style.width = Math.min(100, (elapsed / adState.totalSeconds) * 100) + '%';
    if (elapsed >= adState.totalSeconds) {
      clearInterval(tick);
      claim.classList.remove('hidden');
      content.innerHTML = '<div style="font-size:60px">✅</div><p>Ad completed! Tap "Claim" to get points.</p>';
    }
  }, 100);
  // Store for claimAd
  adState.interval = tick;
}
async function watchAdLong() {
  // For long ad: still same anti-fraud flow, just different reward
  return watchAd();
}
async function claimAd() {
  if (adState.interval) clearInterval(adState.interval);
  closeModal('adModal');
  try {
    const j = await api('/api/earn/ad/claim', { adToken: adState.adToken });
    USER = j.user; refreshUI();
    pushTx('Watched ad', j.points);
    toast('+' + j.points + ' pts!');
  } catch (e) { toast('❌ ' + e.message); }
  adState = { adToken: null, startedAt: 0 };
}

// ===== EARN: SPIN =====
function doSpin() {
  document.getElementById('spinModal').classList.remove('hidden');
}
async function spinNow() {
  const btn = document.getElementById('spinGo');
  btn.disabled = true;
  try {
    const j = await api('/api/earn/spin', {});
    SPIN_RESULT = j.points;
    USER = j.user;
    const segs = SETTINGS.spinRewards.length;
    const idx = SETTINGS.spinRewards.indexOf(SPIN_RESULT);
    const deg = 360 * 5 + (360 - idx * (360 / segs) - (360 / segs) / 2);
    document.getElementById('wheel').style.transform = `rotate(${deg}deg)`;
    setTimeout(() => {
      toast('🎰 +' + SPIN_RESULT + ' pts!');
      pushTx('Lucky spin', SPIN_RESULT);
      refreshUI();
      btn.disabled = false;
      closeModal('spinModal');
    }, 4200);
  } catch (e) {
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
      toast('✅ Correct! +' + j.points + ' pts');
    } else {
      toast('❌ Wrong. +' + j.points + ' pts');
    }
    USER = j.user;
    refreshUI();
    setTimeout(() => loadNextQuestion(), 1500);
  } catch (e) {
    toast('❌ ' + e.message);
    setTimeout(() => loadNextQuestion(), 1500);
  }
}
async function finishQuiz() {
  closeModal('quizModal');
  pushTx('Daily quiz (' + quizState.score + ' correct)', quizState.score * 2);
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
    jazzcash:   { title: '📱 JazzCash',   number: '03470964126',  name: 'UC Bounty' },
    easypaisa:  { title: '📱 Easypaisa',  number: '03470964126',  name: 'UC Bounty' },
    bank:       { title: '🏦 Bank Transfer', number: 'Contact admin', name: 'UC Bounty' },
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
    navigator.share({ title: 'UC Bounty', text: 'Join me on UC Bounty and earn real UC!', url });
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

