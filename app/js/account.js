'use strict';
/* ============ ÚČET (v19.5) ============
   One person = one account: a login (unique, like @name), a display name and a password.
   Every device that logs in gets the same data and the same person in shared cards,
   so reinstalling or adding a computer never creates a second "you" any more.
   The password never leaves the device: it becomes a key (PBKDF2, 150 000 rounds, salted with the login)
   and only that key goes to the server, which keeps a salted hash of it.
   The account owns one sync space (S.sync); its record p:acc tells the other devices who they are. */
Object.assign(IC, { eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>' });
const ACC = { mode: 'new', ctx: 'welcome', busy: false, done: null, rc: '', chk: 0, chkT: 0, offline: false, pending: null };
const accOn = () => !!(S && S.acc && S.acc.login && S.acc.id);
const LOGIN_OK = /^[a-z0-9][a-z0-9._]{2,19}$/;
function normLogin(v) { return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, ''); }
async function passKey(login, pass) {
  const te = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode('aurora-acc:' + login), iterations: 150000 }, k, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ----- this device becomes the account's person ----- */
/* old id → account id in every shared card: same person, no duplicate. The others learn it from y:<old>. */
function adoptId(nid) {
  const old = S.me && S.me.id;
  S.me = { id: nid };
  if (!old || old === nid) return false;
  for (const i of S.items) { if (i.by === old) i.by = nid; if (i.doneBy === old) i.doneBy = nid; }
  for (const m of S.moments) if (m.by === old) m.by = nid;
  for (const ch of S.shared || []) {
    ch.mem = ch.mem || {};
    const was = ch.mem[old] || {}; const cur = ch.mem[nid] || {}; delete ch.mem[old];
    const j = [cur.joined, was.joined, ch.joined].filter(x => x > 0);
    ch.mem[nid] = Object.assign({}, was, cur, { name: S.name || cur.name || was.name, joined: j.length ? Math.min(...j) : Date.now() });
    delete ch.mem[nid].removed;
    if (ch.owner === old) ch.owner = nid;
    ch.olds = [...new Set([...(ch.olds || []), old])].slice(-8);
    ch.alias = Object.assign({}, ch.alias, { [old]: nid });
  }
  if (typeof spoluSchedule === 'function') spoluSchedule(400);
  return true;
}
const ownCount = () => S.cards.filter(c => !c.sh).length + S.items.filter(i => !(typeof spaceOfItem === 'function' && spaceOfItem(i))).length + S.moments.filter(m => !(typeof spaceOfMoment === 'function' && spaceOfMoment(m))).length;

/* the server said yes: link this device to the account's data */
async function accSignedIn(j, o = {}) {
  const sameSpace = S.sync && S.sync.sp === j.sp;
  S.acc = { login: j.login, id: j.id };
  if (j.name && !o.created) S.name = j.name;
  adoptId(j.id);
  S.onboarded = true;
  if (o.created || sameSpace) {
    if (!sameSpace) { S.sync = { sp: j.sp, secret: j.secret, dev: (S.sync && S.sync.dev) || uid(), cur: { r: 0, k: '' }, state: 'ok' }; SY.snap = {}; await snapSave(); }
    save(); syncNow();
    return 'ok';
  }
  // logging in on a device that already has its own plans: ask what to do with them
  if (ownCount()) { ACC.pending = j; return 'ask'; }
  await syncAttach(j.sp, j.secret, 'merge');
  return 'ok';
}
async function accFinishAsk(mode) {
  const j = ACC.pending; ACC.pending = null; if (!j) return;
  await syncAttach(j.sp, j.secret, mode);
}

/* ----- the form (welcome, gate after the update, or a sheet) ----- */
function accCopy() {
  const cs = lang() === 'cs';
  return {
    new: { h: cs ? 'Vytvoř si<br>účet' : 'Create your<br>account', go: cs ? 'Vytvořit účet' : 'Create account', sw: cs ? 'Už mám účet · přihlásit se' : 'I have an account · log in', swk: 'login' },
    login: { h: cs ? 'Přihlas se' : 'Log in', go: cs ? 'Přihlásit' : 'Log in', sw: cs ? 'Nemám účet · vytvořit' : 'No account yet · create one', swk: 'new' },
    recover: { h: cs ? 'Nové heslo' : 'New password', go: cs ? 'Nastavit heslo' : 'Set password', sw: cs ? 'Zpět na přihlášení' : 'Back to log in', swk: 'login' },
  };
}
function accFormHTML() {
  const cs = lang() === 'cs'; const m = ACC.mode; const c = accCopy()[m]; const fr = ACC.ctx === 'sheet' ? 'in' : 'frost';
  const f = (id, ph, attrs, extra = '') => '<div class="fld ' + fr + ' acf' + (extra ? ' ' + extra : '') + '">' + (id === 'acLogin' ? '<span class="acat">@</span>' : '') + '<input id="' + id + '" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '" ' + attrs + '>' + (id === 'acLogin' ? '<span class="acst" id="acSt"></span>' : '') + (id === 'acPass' ? '<button class="aceye" type="button" data-a="acEye" aria-label="' + esc(cs ? 'Ukázat heslo' : 'Show password') + '">' + ico('eye', 18, 2) + '</button>' : '') + '</div>';
  let h = '<h2 class="wbig ach">' + c.h + '</h2>';
  if (m === 'recover') h += '<p class="acp">' + esc(cs ? 'Na zařízení, kde jsi přihlášený: Nastavení → Účet → Změnit heslo. Nebo tady zadej kód pro obnovu, který jsi dostal při založení účtu.' : 'On a device where you are logged in: Settings → Account → Change password. Or enter the recovery code you got when you created the account.') + '</p>';
  if (m === 'new') h += f('acName', cs ? 'Jméno, např. Matěj' : 'Name, e.g. Alex', 'autocomplete="given-name" enterkeyhint="next" value="' + esc(S.name || '') + '"');
  h += f('acLogin', 'login', 'autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" value="' + esc(ACC.login || '') + '"', 'acl');
  if (m === 'recover') h += f('acRc', cs ? 'Kód pro obnovu' : 'Recovery code', 'autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next"', 'acrc');
  h += f('acPass', m === 'login' ? (cs ? 'Heslo' : 'Password') : (cs ? (m === 'recover' ? 'Nové heslo · ' : 'Heslo · ') + 'aspoň 6 znaků' : (m === 'recover' ? 'New password' : 'Password') + ' · 6+ characters'), 'type="password" autocomplete="' + (m === 'login' ? 'current-password' : 'new-password') + '" enterkeyhint="go"', 'acpw');
  h += '<p class="acmsg" id="acMsg">' + esc(m === 'new' ? (cs ? 'Login je jen tvůj, s ním se přihlásíš na telefonu i počítači. Jméno uvidí lidé ve sdílených kartách.' : 'The login is yours alone; use it on your phone and computer. People in shared cards see your name.') : '') + '</p>';
  h += '<div class="acsw"><button class="lnk" data-a="acMode" data-k="' + c.swk + '">' + esc(c.sw) + '</button>' + (m === 'login' ? '<button class="lnk" data-a="acMode" data-k="recover">' + esc(cs ? 'Zapomenuté heslo?' : 'Forgot password?') + '</button>' : '') + '</div>';
  if (ACC.ctx === 'sheet') h += '<button class="pbtn cr press acgo" data-a="acGo">' + esc(c.go) + '</button>';
  if (ACC.ctx === 'gate' || (ACC.offline && ACC.ctx === 'welcome')) h += '<button class="lnk aclater" data-a="acLater">' + esc(ACC.ctx === 'welcome' ? (cs ? 'Pokračovat zatím bez účtu' : 'Continue without an account for now') : (cs ? 'Později' : 'Later')) + '</button>';
  return h;
}
function accRcHTML() {
  const cs = lang() === 'cs';
  return '<h2 class="wbig ach">' + (cs ? 'Ulož si kód<br>pro obnovu' : 'Save your<br>recovery code') + '</h2>'
    + '<div class="acrcbox ' + (ACC.ctx === 'sheet' ? 'in' : 'frost') + '"><b id="acRcCode">' + esc(ACC.rc) + '</b><button class="chip frost press" data-a="acRcCopy">' + ico('copy', 15, 2) + esc(cs ? 'Kopírovat' : 'Copy') + '</button></div>'
    + '<p class="acp">' + esc(cs ? 'Když zapomeneš heslo a nebudeš mít po ruce přihlášené zařízení, tímhle kódem si nastavíš nové. Vyfoť si ho nebo ulož do poznámek, ukážu ho jen teď.' : 'If you forget your password and have no logged-in device at hand, this code sets a new one. Screenshot it or save it in your notes; it is shown only now.') + '</p>'
    + '<p class="acp acme">' + esc(cs ? 'Účet: ' : 'Account: ') + '<b>@' + esc(S.acc ? S.acc.login : '') + '</b></p>'
    + (ACC.ctx === 'sheet' ? '<button class="pbtn cr press acgo" data-a="acGo">' + esc(cs ? 'Uloženo, pokračovat' : 'Saved, continue') + '</button>' : '');
}
function accAskHTML() {
  const cs = lang() === 'cs'; const n = ownCount();
  return '<h2 class="wbig ach">' + (cs ? 'Co s tím,<br>co tu už máš?' : 'What about what<br>is already here?') + '</h2>'
    + '<p class="acp">' + esc(cs ? 'V tomhle zařízení je ' + n + ' ' + (n === 1 ? 'věc' : n < 5 ? 'věci' : 'věcí') + ', které v účtu @' + S.acc.login + ' nejsou.' : 'This device has ' + n + ' things that are not in @' + S.acc.login + '.') + '</p>'
    + '<button class="acopt frost press" data-a="acAsk" data-k="merge"><b>' + esc(cs ? 'Přidat do účtu' : 'Add to my account') + '</b><small>' + esc(cs ? 'Spojí se s tím, co v účtu už je' : 'Merged with what the account has') + '</small></button>'
    + '<button class="acopt frost press" data-a="acAsk" data-k="replace"><b>' + esc(cs ? 'Nahradit účtem' : 'Replace with my account') + '</b><small>' + esc(cs ? 'Tyhle věci z tohoto zařízení zmizí' : 'These things leave this device') + '</small></button>';
}
function accBtnLabel() {
  const cs = lang() === 'cs';
  if (ACC.rc) return cs ? 'Pokračovat' : 'Continue';
  if (ACC.pending) return '';
  return accCopy()[ACC.mode].go;
}
function accPaint() {
  const box = $('#acBox'); if (!box) return;
  box.innerHTML = ACC.rc ? accRcHTML() : ACC.pending ? accAskHTML() : accFormHTML();
  box.dataset.m = ACC.rc ? 'rc' : ACC.pending ? 'ask' : ACC.mode;
  const b = ACC.ctx !== 'sheet' && $('#wNext'); if (b && (ACC.ctx === 'gate' || $('#welcome')._k === 1)) { b.textContent = accBtnLabel(); b.style.visibility = ACC.pending ? 'hidden' : ''; }
  accMount();
}
function accMount() {
  const lg = $('#acLogin'), pw = $('#acPass'), nm = $('#acName'), rc = $('#acRc');
  const fields = [nm, lg, rc, pw].filter(Boolean);
  fields.forEach((el, k) => el.addEventListener('keydown', e => { if (e.key !== 'Enter') return; e.preventDefault(); const nx = fields[k + 1]; if (nx) nx.focus(); else ACT.acGo(); }));
  if (nm) nm.addEventListener('input', () => { if (ACC.ctx !== 'sheet') S.name = nm.value; });
  if (lg) lg.addEventListener('input', () => {
    const v = normLogin(lg.value); if (v !== lg.value) { const p = lg.selectionStart; lg.value = v; try { lg.setSelectionRange(p, p); } catch (e) {} }
    ACC.login = v; accMsg('');
    if (ACC.mode !== 'new') return;
    clearTimeout(ACC.chkT); const st = $('#acSt'); if (st) { st.className = 'acst'; st.textContent = ''; }
    if (!v) return;
    if (!LOGIN_OK.test(v)) { if (st) { st.className = 'acst no'; st.textContent = v.length < 3 ? '' : '!'; } return; }
    ACC.chkT = setTimeout(async () => { const my = ++ACC.chk; try { const j = await syncApi('/a/check', { login: v }); if (my !== ACC.chk || normLogin(lg.value) !== v) return; const s = $('#acSt'); if (!s) return; s.className = 'acst ' + (j.free ? 'ok' : 'no'); s.innerHTML = j.free ? ico('check', 15, 2.6) : ''; if (!j.free) accMsg(lang() === 'cs' ? 'Login @' + v + ' už někdo má, zkus jiný.' : '@' + v + ' is taken, try another.', true); } catch (e) {} }, 380);
  });
}
function accMsg(t, bad) { const m = $('#acMsg'); if (!m) return; m.textContent = t || (ACC.mode === 'new' && !bad ? (lang() === 'cs' ? 'Login je jen tvůj, s ním se přihlásíš na telefonu i počítači. Jméno uvidí lidé ve sdílených kartách.' : 'The login is yours alone; use it on your phone and computer. People in shared cards see your name.') : ''); m.classList.toggle('bad', !!bad); }
ACT.acMode = el => { ACC.mode = el.dataset.k; ACC.login = normLogin(($('#acLogin') || {}).value || ACC.login || ''); accPaint(); };
ACT.acEye = () => { const p = $('#acPass'); if (!p) return; p.type = p.type === 'password' ? 'text' : 'password'; $('.aceye').classList.toggle('on', p.type === 'text'); };
ACT.acRcCopy = async () => { try { await navigator.clipboard.writeText(ACC.rc); toast(esc(lang() === 'cs' ? 'Kód zkopírovaný' : 'Code copied')); } catch (e) { toast(esc(ACC.rc)); } };
ACT.acAsk = async el => { const cs = lang() === 'cs'; $$('.acopt').forEach(b => b.disabled = true); try { await accFinishAsk(el.dataset.k); accDone('login'); } catch (e) { toast(esc(cs ? 'Bez spojení se serverem, zkus to znovu' : 'No connection, try again')); $$('.acopt').forEach(b => b.disabled = false); } };
ACT.acLater = () => {
  if (ACC.ctx === 'welcome') { const n = $('#acName'); const v = n ? n.value.trim() : ''; if (n && !v) { accMsg(lang() === 'cs' ? 'Napiš aspoň jméno, účet doplníš, až budeš online.' : 'Type your name; add the account once you are online.', true); n.focus(); return; } if (v) S.name = v; ACT.wEmpty(); return; }
  S.accLater = Date.now(); save(); hideWelcome(); render(); // the Home tip keeps reminding
};

ACT.acGo = async () => {
  if (ACC.busy) return;
  const cs = lang() === 'cs';
  if (ACC.rc) { ACC.rc = ''; accDone('new'); return; }
  if (ACC.pending) return;
  const m = ACC.mode;
  const login = normLogin(($('#acLogin') || {}).value); const pass = ($('#acPass') || {}).value || '';
  const name = m === 'new' ? (($('#acName') || {}).value || '').trim() : '';
  const rcv = m === 'recover' ? (($('#acRc') || {}).value || '').toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  const bad = (t, el) => { accMsg(t, true); if (el) { el.closest('.fld').classList.add('err'); setTimeout(() => el.closest('.fld') && el.closest('.fld').classList.remove('err'), 900); } };
  if (m === 'new' && !name) return bad(cs ? 'Napiš, jak ti mají říkat.' : 'Type your name.', $('#acName'));
  if (!LOGIN_OK.test(login)) return bad(cs ? 'Login: 3 až 20 znaků, malá písmena, čísla, tečka nebo podtržítko.' : 'Login: 3–20 characters, lowercase letters, digits, dot or underscore.', $('#acLogin'));
  if (m === 'recover' && rcv.length !== 12) return bad(cs ? 'Kód pro obnovu má 12 znaků.' : 'The recovery code has 12 characters.', $('#acRc'));
  if (pass.length < (m === 'login' ? 1 : 6)) return bad(m === 'login' ? (cs ? 'Napiš heslo.' : 'Type your password.') : (cs ? 'Heslo musí mít aspoň 6 znaků.' : 'The password needs 6+ characters.'), $('#acPass'));
  ACC.busy = true; const btn = ACC.ctx === 'sheet' ? $('.acgo') : $('#wNext'); const lbl = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = m === 'new' ? (cs ? 'Zakládám…' : 'Creating…') : (cs ? 'Ověřuju…' : 'Checking…'); }
  try {
    const pk = await passKey(login, pass);
    let j, r;
    if (m === 'new') {
      j = await syncApi('/a/new', { login, name, pk, me: meId(), sp: S.sync && S.sync.sp, secret: S.sync && S.sync.secret });
      S.name = name; r = await accSignedIn(j, { created: true }); ACC.rc = j.rc;
    } else if (m === 'login') { j = await syncApi('/a/login', { login, pk }); r = await accSignedIn(j); }
    else { j = await syncApi('/a/recover', { login, rc: rcv, pk }); r = await accSignedIn(j); ACC.rc = j.rc; }
    ACC.busy = false; ACC.offline = false;
    if (btn) btn.disabled = false;
    if (r === 'ask' || ACC.rc) { accPaint(); return; }
    accDone(m);
  } catch (e) {
    ACC.busy = false; if (btn) { btn.disabled = false; btn.textContent = lbl; }
    const net = !e.status || e.status >= 500;
    if (net) ACC.offline = true;
    accMsg(e.code === 'taken' ? (cs ? 'Login @' + login + ' už někdo má, zkus jiný.' : '@' + login + ' is taken, try another.')
      : e.code === 'badlogin' ? (m === 'recover' ? (cs ? 'Login nebo kód pro obnovu nesedí.' : 'Login or recovery code is wrong.') : (cs ? 'Login nebo heslo nesedí.' : 'Wrong login or password.'))
      : e.code === 'slow' ? (cs ? 'Moc pokusů. Zkus to znovu za 15 minut.' : 'Too many tries. Try again in 15 minutes.')
      : (cs ? 'Bez spojení se serverem. Účet potřebuje internet, zkus to za chvíli.' : 'No connection to the server. The account needs internet; try again soon.'), true);
    if (net && ACC.ctx === 'welcome' && !$('.aclater')) { const b = document.createElement('button'); b.className = 'lnk aclater'; b.dataset.a = 'acLater'; b.textContent = ACC.ctx === 'welcome' ? (cs ? 'Pokračovat zatím bez účtu' : 'Continue without an account for now') : (cs ? 'Teď ne, nejsem online' : 'Not now, I am offline'); $('#acBox').appendChild(b); }
  }
};
/* what happens after a successful create / log in */
function accDone(m) {
  const cs = lang() === 'cs'; const ctx = ACC.ctx; const then = ACC.done; ACC.done = null;
  ACC.mode = 'new'; ACC.login = '';
  if (ctx === 'sheet') { closeSheet(true); if (then) setTimeout(then, 320); return; }
  if (ctx === 'welcome' && m === 'new') { ACT.wEmpty(); return; }
  hideWelcome(); applyLook(); buildNav(); go('home'); render();
  if (then) setTimeout(then, 320);
  toast(esc(m === 'new' ? (cs ? 'Účet je hotový ✓' : 'Account ready ✓') : (cs ? 'Ahoj, ' : 'Hi, ') + ((S.name || '').trim() || '@' + S.acc.login)));
}

/* existing users after the update: one calm screen, the same look as the welcome */
function showAccGate(then) {
  const w = $('#welcome'); const cs = lang() === 'cs';
  ACC.ctx = 'gate'; ACC.mode = 'new'; ACC.rc = ''; ACC.pending = null; ACC.done = then || null;
  w.innerHTML = '<div class="wtop"><img class="wmini" src="logo.svg" alt="aurora"><span style="flex:1"></span></div>'
    + '<div class="wsl acgate"><section class="ws acws"><span class="cap acnew">' + esc(cs ? 'Nově v Auroře' : 'New in Aurora') + '</span><div id="acBox"></div>'
    + '<p class="acp acwhy">' + esc(cs ? 'Účet drží tvoje data pohromadě: na telefonu i počítači jsi pořád ty a ve sdílených kartách tě ostatní vidí jen jednou. Tvoje plány zůstávají, jak jsou.' : 'An account keeps your data together: on your phone and computer you are always you, and shared cards show you once. Your plans stay as they are.') + '</p></section></div>'
    + '<div class="wfoot"><button class="pbtn cr press" id="wNext" data-a="acGo"></button></div>';
  w.classList.add('on', 'acc'); w._k = 1; w._draw = () => showAccGate(then);
  $('#nav').classList.add('away'); document.body.classList.add('navless');
  accPaint();
}
/* inside a flow (joining a shared card…): the same form in a sheet */
function accSheet(then, reason) {
  const cs = lang() === 'cs';
  ACC.ctx = 'sheet'; ACC.mode = 'new'; ACC.rc = ''; ACC.pending = null; ACC.done = then || null;
  openSheet({ title: '', leftLabel: cs ? 'Zavřít' : 'Close', cls: 'accsheet', body: (reason ? '<div class="acreason">' + esc(reason) + '</div>' : '') + '<div id="acBox"></div>', mount: accPaint,
    onClose: () => { ACC.ctx = 'welcome'; if (!S.onboarded && !accOn()) setTimeout(() => { if (!S.onboarded && !SH.open) showWelcome(); }, 350); } });
}
/* after login on a device with an older Aurora: everything already in the account? nothing to ask */
async function accBoot() {
  if (accOn() || !S.onboarded) return;
  const q = new URLSearchParams(location.search); if (q.get('join')) return;
  if (syncOn()) { try { await Promise.race([syncNow(), new Promise(r => setTimeout(r, 6000))]); } catch (e) {} }
  if (accOn() || $('#welcome').classList.contains('on') || $('#install')) return;
  if (S.accLater) return; // said Later once: from now on only the Home tip
  try { if (localStorage.getItem('aurNoGate')) return; } catch (e) {} // automated tests only
  showAccGate();
}

/* Home: the first card of the stack until there is an account (× hides it for today) */
function accTip() {
  if (!S || !S.onboarded || accOn() || S.accTipX === T()) return null;
  const cs = lang() === 'cs';
  return { h: cs ? 'Vytvoř si účet.' : 'Create your account.', b: cs ? 'Stejná data na telefonu i počítači a ve sdílených kartách jsi vždycky jen jednou. Zabere to pár vteřin.' : 'The same data on your phone and computer, and you appear once in shared cards. Takes seconds.' };
}
function cardAcc(tp) {
  const cs = lang() === 'cs';
  return '<div class="lh"><span class="cap">' + esc(cs ? 'Nově · účet' : 'New · account') + '</span><button class="hx press" data-a="accTipX" aria-label="' + esc(cs ? 'Dnes skrýt' : 'Hide for today') + '">' + ico('x', 14, 2.4) + '</button></div>'
    + '<div class="hbig">' + esc(tp.h) + '</div><div class="hp">' + esc(tp.b) + '</div>'
    + '<button class="hbtn press" data-a="accTipGo">' + esc(cs ? 'Vytvořit účet' : 'Create account') + '</button>';
}
ACT.accTipX = () => { S.accTipX = T(); save(); render(); };
ACT.accTipGo = () => showAccGate();

/* ----- Settings → Účet ----- */
function accPage() {
  const cs = lang() === 'cs'; const on = accOn();
  let h = '<div class="hdr"><button class="cb frost press" data-a="settingsBack" aria-label="Back">' + ico('back', 20, 2.2) + '</button><span></span></div><h1 class="t1" style="margin-bottom:18px">' + esc(cs ? 'Účet' : 'Account') + '</h1>';
  if (!on) {
    return h + '<section class="nstat frost"><span class="ni">' + ico('users', 22, 1.9) + '</span><span class="tx"><b>' + esc(cs ? 'Bez účtu' : 'No account') + '</b><small>' + esc(cs ? 'S účtem máš stejná data na všech zařízeních a ve sdílených kartách jsi vždycky jen jednou.' : 'With an account your data is the same on every device and you appear once in shared cards.') + '</small></span></section>'
      + '<button class="pbtn cr press" style="width:100%;margin-top:16px" data-a="acOpen">' + esc(cs ? 'Vytvořit účet nebo se přihlásit' : 'Create an account or log in') + '</button>';
  }
  const ini = ((S.name || S.acc.login || '?').trim().charAt(0) || '?').toUpperCase();
  h += '<section class="acprof frost"><span class="avatar">' + esc(ini) + '</span><span class="tx"><b>' + esc(S.name || '') + '</b><small>@' + esc(S.acc.login) + '</small></span></section>'
    + '<div class="sec"><section class="grp frost solid">' + srow('editName', '<span class="tx">' + esc(cs ? 'Jméno' : 'Name') + '<small>' + esc(cs ? 'Vidí ho lidé ve sdílených kartách' : 'People in shared cards see it') + '</small></span>', esc(S.name || '')) + '<div class="srow"><span class="tx">Login<small>' + esc(cs ? 'S ním se přihlásíš na dalším zařízení' : 'Use it to log in on another device') + '</small></span><span class="r">@' + esc(S.acc.login) + '</span></div></section></div>'
    + '<div class="sec"><span class="cap">' + esc(cs ? 'Zabezpečení' : 'Security') + '</span><section class="grp frost solid">' + srow('acPass', esc(cs ? 'Změnit heslo' : 'Change password'), '') + srow('acNewRc', '<span class="tx">' + esc(cs ? 'Nový kód pro obnovu' : 'New recovery code') + '<small>' + esc(cs ? 'Starý tím přestane platit' : 'The old one stops working') + '</small></span>', '') + '</section></div>'
    + '<div class="sec"><section class="grp frost solid"><button class="srow red" data-a="acLogout">' + ico('leave', 16, 2) + esc(cs ? 'Odhlásit se z tohoto zařízení' : 'Log out of this device') + '</button></section></div>'
    + '<div class="muted" style="font:400 12.5px/1.5 Inter;margin:14px 6px 0">' + esc(cs ? 'Na telefonu i počítači se přihlas stejným loginem a máš všude totéž. Heslo neodchází ze zařízení, server dostane jen jeho otisk.' : 'Log in with the same login on your phone and computer to have the same everywhere. The password never leaves the device; the server gets only a fingerprint of it.') + '</div>';
  return h;
}
ACT.accPage = () => { V.settingsPage = 'acc'; renderSettings(); $('#s-settings').scrollTop = 0; };
ACT.acOpen = () => { closeSettings(true); showAccGate(); };
ACT.acPass = () => {
  const cs = lang() === 'cs';
  openSheet({ title: cs ? 'Nové heslo' : 'New password', right: cs ? 'Uložit' : 'Save', body: '<div class="fld in acf acpw"><input id="npIn" type="password" placeholder="' + esc(cs ? 'Nové heslo · aspoň 6 znaků' : 'New password · 6+ characters') + '" autocomplete="new-password" enterkeyhint="done"><button class="aceye" type="button" data-a="npEye">' + ico('eye', 18, 2) + '</button></div><p class="acmsg" id="npMsg">' + esc(cs ? 'Ostatní přihlášená zařízení zůstanou přihlášená.' : 'Your other logged-in devices stay logged in.') + '</p>',
    mount: () => { const i = $('#npIn'); autoFocus(i, 380); i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); SH.onSave && SH.onSave(); } }); },
    onSave: async () => {
      const v = $('#npIn').value; const m = $('#npMsg');
      if (v.length < 6) { m.textContent = cs ? 'Heslo musí mít aspoň 6 znaků.' : 'The password needs 6+ characters.'; m.classList.add('bad'); return; }
      try { const pk = await passKey(S.acc.login, v); await syncApi('/a/pass', { login: S.acc.login, sp: S.sync.sp, secret: S.sync.secret, pk }); closeSheet(true); toast(esc(cs ? 'Heslo změněno ✓' : 'Password changed ✓')); }
      catch (e) { m.textContent = e.status === 403 ? (cs ? 'Tohle zařízení už není přihlášené. Přihlas se znovu.' : 'This device is no longer logged in.') : (cs ? 'Bez spojení se serverem, zkus to znovu.' : 'No connection, try again.'); m.classList.add('bad'); }
    } });
};
ACT.npEye = () => { const p = $('#npIn'); p.type = p.type === 'password' ? 'text' : 'password'; };
ACT.acNewRc = () => {
  const cs = lang() === 'cs';
  confirmSheet(cs ? 'Vytvořit nový kód pro obnovu? Ten starý přestane platit.' : 'Create a new recovery code? The old one stops working.', cs ? 'Vytvořit' : 'Create', async () => {
    try { const j = await syncApi('/a/rc', { login: S.acc.login, sp: S.sync.sp, secret: S.sync.secret }); ACC.ctx = 'sheet'; ACC.rc = j.rc; ACC.done = null;
      setTimeout(() => openSheet({ title: '', leftLabel: cs ? 'Hotovo' : 'Done', cls: 'accsheet', body: '<div id="acBox"></div>', mount: accPaint, onClose: () => { ACC.rc = ''; } }), 330);
    } catch (e) { toast(esc(cs ? 'Bez spojení se serverem' : 'No connection to the server')); }
  });
};
ACT.acLogout = () => {
  const cs = lang() === 'cs';
  confirmSheet(cs ? 'Odhlásit se? Všechno zůstane v účtu @' + S.acc.login + ', z tohoto zařízení to zmizí. Přihlásíš se zpátky loginem a heslem.' : 'Log out? Everything stays in @' + S.acc.login + ' and leaves this device. Log back in with your login and password.', cs ? 'Odhlásit' : 'Log out', async () => {
    toast(esc(cs ? 'Ukládám do účtu…' : 'Saving to your account…'));
    try { await syncPush(); if (typeof spoluSyncAll === 'function') await spoluSyncAll(); }
    catch (e) { toast(esc(cs ? 'Nejsi online, odhlásit půjde, až se vše uloží.' : 'You are offline; log out once everything is saved.')); return; }
    const keep = { lang: S.lang, wall: S.wall, wallKey: S.wallKey, surface: S.surface, dim: S.dim, push: S.push, tips: S.tips, tipsOff: S.tipsOff, me: S.me };
    for (const ch of S.shared || []) { try { DB.del('kv', 'snap:' + ch.sp); } catch (e) {} if (ch.subDev) { try { await syncApi('/s/sub', { sp: ch.sp, secret: ch.secret, dev: ch.subDev, off: true }); } catch (e) {} } }
    S = Object.assign(blankState(), keep, { onboarded: false });
    SY.snap = {}; await snapSave(); if (typeof SP !== 'undefined') SP.snaps = {}; save(); if (typeof pushSchedule === 'function') pushSchedule();
    closeSettings(true); applyLook(); buildNav(); go('home'); render(); showWelcome();
  });
};

/* v19.5.2 · admin Users tab: once a day each logged-in device says "I was here" (version, platform). No content. */
function accSeen() {
  if (typeof accOn !== 'function' || !accOn() || !syncOn() || !S.sync.dev) return;
  const k = S.acc.login + '|' + T() + '|' + VERSION; let last = '';
  try { last = localStorage.getItem('aurSeenA') || ''; } catch (e) {}
  if (last === k) return;
  const ua = navigator.userAgent || '';
  const plat = /iPhone|iPod/.test(ua) ? 'iphone' : (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) ? 'ipad' : /Android/.test(ua) ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'mac' : 'other';
  const mode = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? 'app' : 'web';
  syncApi('/a/seen', { login: S.acc.login, sp: S.sync.sp, secret: S.sync.secret, dev: S.sync.dev, ver: VERSION, plat, mode })
    .then(() => { try { localStorage.setItem('aurSeenA', k); } catch (e) {} }).catch(() => {});
}
