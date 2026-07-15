const https = require('https');
function req(method, path, body, token, deviceId) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = { hostname: 'uc-bounty-production.up.railway.app', path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (deviceId) opts.headers['x-device-id'] = deviceId;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(opts, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', e => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}
(async () => {
  const deviceId = 'TEST_DEVICE_' + Date.now();
  const username = 'qt' + Date.now().toString().slice(-4);
  console.log('Testing user:', username);
  const su = await req('POST', '/api/signup', { username, deviceId, pubgId: '12345' });
  console.log('SIGNUP:', su.status, su.body.slice(0, 200));
  const sj = JSON.parse(su.body);
  const token = sj.token;
  const start = await req('POST', '/api/earn/quiz/start', {}, token, deviceId);
  console.log('START:', start.status, start.body.slice(0, 400));
  const sq = JSON.parse(start.body);
  if (!sq.question) return;
  console.log('Q:', sq.question.q);
  console.log('Opts:', JSON.stringify(sq.question.opts));
  console.log('correctAnswer idx:', sq.question.correctAnswer);
  const ans = await req('POST', '/api/earn/quiz/answer', { qHash: sq.question.hash, picked: sq.question.correctAnswer, startTime: Date.now() - 5000 }, token, deviceId);
  console.log('ANSWER:', ans.status, ans.body.slice(0, 300));
})();
