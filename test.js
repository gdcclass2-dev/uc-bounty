const https = require('https');
function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = { hostname: 'uc-bounty-production.up.railway.app', path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(opts, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf, location: res.headers.location }));
    });
    r.on('error', e => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}
(async () => {
  const login = await req('POST', '/api/login', { username: 'shadowhunt', password: 'shadow123' });
  console.log('LOGIN:', login.status, login.body?.slice(0, 200));
  let token;
  try { token = JSON.parse(login.body).token; } catch(e) { console.log('parse err'); return; }
  if (!token) { console.log('no token in:', login.body?.slice(0,300)); return; }
  const start = await req('POST', '/api/earn/quiz/start', {}, token);
  console.log('START:', start.status, start.body?.slice(0, 500));
  const sq = JSON.parse(start.body);
  const q = sq.question;
  if (!q) { console.log('no question - maybe limit reached'); return; }
  console.log('CorrectAnswer index:', q.correctAnswer, '/', q.opts.length);
  const ans = await req('POST', '/api/earn/quiz/answer', { qHash: q.hash, picked: q.correctAnswer, startTime: Date.now() - 5000 }, token);
  console.log('ANSWER:', ans.status, ans.body?.slice(0, 300));
})();
