/* Aurora v18 — beta: install gate, tips in context, feedback */

/* ---------- 1. install: the right steps for where the person is (v19.5.1) ----------
   Instagram & co. on iPhone: their browser cannot add to the Home Screen and does not keep data,
   so the screen only shows how to get to Safari (no "continue here"). Android: Chrome installs in one tap. */
const UA = navigator.userAgent || '';
function installCtx() {
  const q = new URLSearchParams(location.search).get('ictx'); if (q) return q;
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Snapchat|LinkedInApp|Twitter/i.test(UA);
  const android = /Android/i.test(UA);
  if (inApp) return android ? 'inapp-android' : 'inapp-ios';
  if (android) return 'android';
  if (/CriOS|EdgiOS|FxiOS/.test(UA)) return 'ios-other';
  return 'safari';
}
function needInstall() {
  if (isStandalone()) return false;
  const c = installCtx(); if (c.startsWith('inapp')) return true;   // inside Instagram nothing would be kept
  if (c !== 'android' && !isIOS()) return false;
  try { if (localStorage.getItem('aurBrowser') === '1') return false; } catch (e) {}
  return true;
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.AUR_BIP = e; });
function showInstall(done) {
  const cs = lang() === 'cs'; const c = installCtx();
  const el = document.createElement('div'); el.id = 'install'; el.dataset.ctx = c; el.setAttribute('role', 'dialog');
  const step = (n, html, icon) => '<div class="istep frost"><span class="in">' + n + '</span><span class="it">' + html + '</span>' + icon + '</div>';
  const sv = d => '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const shareI = sv('<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/>');
  const plusI = sv('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>');
  const dotsI = sv('<circle cx="5.5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor"/>');
  const vdotsI = sv('<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>');
  const extI = sv('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>');
  const togI = '<span class="itog" aria-hidden="true"><i></i></span>';
  const app = '<img src="icon-180.png" alt="" class="imini">';
  const upR = t => '<div class="ihint up"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 24L24 6"/><path d="M11 6h13v13"/></svg><span>' + esc(t) + '</span></div>';
  const down = t => '<div class="ihint"><span>' + esc(t) + '</span><svg aria-hidden="true" width="26" height="30" viewBox="0 0 26 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2v24"/><path d="M5 18l8 8 8-8"/></svg></div>';
  let h1, p, steps, foot = '', top = '';
  if (c === 'inapp-ios') {
    h1 = cs ? 'Otevři Auroru<br>v Safari.' : 'Open Aurora<br>in Safari.';
    p = cs ? 'Teď jsi v prohlížeči Instagramu. Na plochu se Aurora přidá jen ze Safari a jen tam ti zůstanou data.' : 'You are in Instagram’s browser. Aurora can only be added to your Home Screen from Safari, and only there your data stays.';
    steps = step(1, cs ? 'Klepni na <b>⋯</b> vpravo nahoře' : 'Tap <b>⋯</b> at the top right', dotsI) + step(2, cs ? 'Vyber <b>Otevřít v externím prohlížeči</b>' : 'Choose <b>Open in external browser</b>', extI) + step(3, cs ? 'V Safari ji přidáš na plochu' : 'In Safari, add it to your Home Screen', app);
    top = upR(cs ? 'tady ⋯' : 'here ⋯');
    foot = '<button class="pbtn in press iwide" data-a="installCopy">' + esc(cs ? 'Zkopírovat odkaz' : 'Copy the link') + '</button><small class="inote">' + esc(cs ? 'Nebo odkaz vlož do Safari sám.' : 'Or paste the link into Safari yourself.') + '</small>';
  } else if (c === 'inapp-android') {
    h1 = cs ? 'Otevři Auroru<br>v Chrome.' : 'Open Aurora<br>in Chrome.';
    p = cs ? 'Teď jsi v prohlížeči Instagramu. Nainstalovat Auroru jde v Chrome a jen tam ti zůstanou data.' : 'You are in Instagram’s browser. Aurora installs from Chrome, and only there your data stays.';
    steps = step(1, cs ? 'Klepni na <b>Otevřít v Chrome</b>' : 'Tap <b>Open in Chrome</b>', extI) + step(2, cs ? 'Chrome nabídne <b>Nainstalovat</b>' : 'Chrome offers <b>Install</b>', plusI) + step(3, cs ? 'Spouštěj z <b>ikony</b>' : 'Open it from the <b>icon</b>', app);
    foot = '<button class="pbtn cr press iwide" data-a="installChrome">' + esc(cs ? 'Otevřít v Chrome' : 'Open in Chrome') + '</button><button class="lnk" data-a="installCopy">' + esc(cs ? 'Zkopírovat odkaz' : 'Copy the link') + '</button>';
  } else if (c === 'android') {
    h1 = cs ? 'Nainstaluj<br>Auroru.' : 'Install<br>Aurora.';
    p = cs ? 'Jedno klepnutí a máš ji na ploše jako appku: na celou obrazovku, offline a s upozorněními.' : 'One tap and it is on your Home Screen like an app: full screen, offline and with notifications.';
    steps = step(1, cs ? 'Klepni na <b>Nainstalovat</b>' : 'Tap <b>Install</b>', plusI) + step(2, cs ? 'Spouštěj z <b>ikony</b>' : 'Open it from the <b>icon</b>', app);
    foot = '<button class="pbtn cr press iwide" data-a="installBip">' + esc(cs ? 'Nainstalovat' : 'Install') + '</button><button class="lnk" data-a="installSkip">' + esc(cs ? 'Pokračovat v prohlížeči' : 'Continue in the browser') + '</button>';
  } else if (c === 'ios-other') {
    h1 = cs ? 'Přidej Auroru<br>na plochu.' : 'Add Aurora to your<br>Home Screen.';
    p = cs ? 'V prohlížeči je to jen web. Z plochy funguje jako appka: na celou obrazovku, offline a s upozorněními.' : 'In the browser it is just a website. From the Home Screen it works like an app.';
    steps = step(1, cs ? 'Klepni na <b>Sdílet</b> v adresním řádku' : 'Tap <b>Share</b> in the address bar', shareI) + step(2, cs ? 'Vyber <b>Přidat na plochu</b>' : 'Choose <b>Add to Home Screen</b>', plusI) + step(3, cs ? 'Spouštěj z <b>ikony</b>' : 'Open it from the <b>icon</b>', app);
    top = upR(cs ? 'Sdílet je nahoře' : 'Share is at the top');
    foot = '<button class="lnk" data-a="installSkip">' + esc(cs ? 'Pokračovat v prohlížeči' : 'Continue in the browser') + '</button>';
  } else {
    h1 = cs ? 'Přidej Auroru<br>na plochu.' : 'Add Aurora to your<br>Home Screen.';
    p = cs ? 'V Safari je to jen web. Z plochy funguje jako appka: na celou obrazovku, offline a s upozorněními.' : 'In Safari it is just a website. From the Home Screen it works like an app: full screen, offline and with notifications.';
    steps = step(1, cs ? 'Klepni na <b>Sdílet</b> <small>(nebo ⋯ → Sdílet)</small>' : 'Tap <b>Share</b> <small>(or ⋯ → Share)</small>', shareI)
      + step(2, cs ? 'Sjeď dolů na <b>Přidat na plochu</b> <small>(skryté pod Zobrazit další)</small>' : 'Scroll to <b>Add to Home Screen</b> <small>(under Show more)</small>', plusI)
      + step(3, cs ? 'Nech zapnuté <b>Otevřít jako webovou aplikaci</b> → Přidat' : 'Keep <b>Open as Web App</b> on → Add', togI);
    foot = '<button class="lnk" data-a="installSkip">' + esc(cs ? 'Pokračovat v prohlížeči' : 'Continue in the browser') + '</button>' + down(cs ? 'Sdílet je dole v Safari' : 'Share is at the bottom of Safari');
  }
  el.innerHTML = top + '<div class="iin"><img class="iicon" src="icon-180.png" alt=""><h1>' + h1 + '</h1><p>' + esc(p) + '</p><div class="isteps">' + steps + '</div></div><div class="ifoot">' + foot + '</div>';
  el.setAttribute('aria-label', h1.replace(/<br>/g, ' '));
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  const appURL = () => { const u = new URL(location.href); const j = u.searchParams.get('join'); u.search = ''; u.hash = ''; if (j) u.searchParams.set('join', j); return u.toString(); };
  ACT.installSkip = () => { try { localStorage.setItem('aurBrowser', '1'); } catch (e) {} el.classList.remove('on'); setTimeout(() => el.remove(), 400); done && done(); };
  ACT.installCopy = async () => { try { await navigator.clipboard.writeText(appURL()); toast(esc(cs ? 'Odkaz zkopírovaný. Vlož ho do Safari.' : 'Link copied. Paste it into Safari.')); } catch (e) { toast(esc(appURL())); } };
  ACT.installChrome = () => { const u = new URL(appURL()); location.href = 'intent://' + u.host + u.pathname + u.search + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(u.href) + ';end'; };
  ACT.installBip = async () => { const e = window.AUR_BIP; if (!e) { toast(esc(cs ? 'Menu ⋮ → Přidat na plochu' : 'Menu ⋮ → Add to Home screen')); return; } e.prompt(); try { await e.userChoice; } catch (er) {} window.AUR_BIP = null; ACT.installSkip(); };
}

/* ---------- 2. tips in context (Apple: ask when it makes sense) ---------- */
function tipSeen(k) { return !!(S.tips && S.tips[k]); }
function tipMark(k) { S.tips = S.tips || {}; S.tips[k] = Date.now(); save(); }
function closeTip() { const rg = $('#tipring'); if (rg) { rg.classList.remove('on'); setTimeout(() => rg.remove(), 260); } const t0 = $('#tip'); if (!t0) return; t0.classList.remove('on'); setTimeout(() => t0.remove(), 260); document.removeEventListener('pointerdown', tipOutside, true); }
function tipOutside(e) { if (!e.target.closest('#tip')) closeTip(); }
/* o: { key, anchor, title, body, icon, ok, okFn, no } */
function showTip(o) {
  if (!o.anchor || tipSeen(o.key) || $('#tip')) return false;
  const r = o.anchor.getBoundingClientRect(); if (r.height === 0 || r.top < 0 || r.bottom > innerHeight) return false;
  tipMark(o.key);
  const el = document.createElement('div'); el.id = 'tip'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', o.title);
  el.innerHTML = '<div class="tph">' + (o.icon || '') + '<b>' + esc(o.title) + '</b></div><p>' + esc(o.body) + '</p><div class="tpa">'
    + (o.no ? '<button class="tno" data-x="no">' + esc(o.no) + '</button>' : '') + '<button class="tok' + (o.okFn ? ' fill' : '') + '" data-x="ok">' + esc(o.ok) + '</button></div><i class="tarr"></i>';
  document.body.appendChild(el);
  const w = Math.min(innerWidth - 32, 380), left = Math.max(16, Math.min(innerWidth - w - 16, r.left + r.width / 2 - w / 2));
  el.style.width = w + 'px'; el.style.left = left + 'px';
  const h = el.offsetHeight, above = r.top - h - 14 > 20;
  if (o.place === 'over') { el.style.top = (r.top + Math.max(8, (r.height - h) / 2)) + 'px'; el.classList.add('over'); el.querySelector('.tarr').style.display = 'none'; }
  else { el.style.top = (above ? r.top - h - 14 : r.bottom + 14) + 'px'; el.classList.toggle('below', !above); }
  el.querySelector('.tarr').style.left = clamp(r.left + 34 - left, 22, w - 40) + 'px';
  const ring = document.createElement('div'); ring.id = 'tipring'; ring.style.cssText = 'left:' + (r.left - 3) + 'px;top:' + (r.top - 3) + 'px;width:' + (r.width + 6) + 'px;height:' + (r.height + 6) + 'px;border-radius:' + getComputedStyle(o.anchor).borderRadius;
  document.body.appendChild(ring);
  el.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (!b) return; closeTip(); if (b.dataset.x === 'ok' && o.okFn) o.okFn(); });
  requestAnimationFrame(() => { el.classList.add('on'); ring.classList.add('on'); });
  setTimeout(() => document.addEventListener('pointerdown', tipOutside, true), 600);
  const sb = $('#sheet .sb'); sb && sb.addEventListener('scroll', closeTip, { once: true, passive: true });
  return true;
}
const tipUsers = () => '<span class="tav"><i>' + esc(((S.name || 'Já').trim()[0] || 'J').toUpperCase()) + '</i><i>+</i></span>';
const tipBell = () => '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
function tipSpolu(anchor) {
  if ((S.shared || []).length) { tipMark('spolu'); return; }
  const cs = lang() === 'cs';
  showTip({ key: 'spolu', anchor, icon: tipUsers(), title: cs ? 'Můžeš přidat parťáka' : 'You can add a partner', body: cs ? 'Kartu můžeš sdílet s až 5 lidmi. Každý odškrtává za sebe a vidíte, kdo má hotovo.' : 'Share a card with up to 5 people. Everyone checks off their own part and you see who is done.', ok: cs ? 'Rozumím' : 'Got it' });
}
function tipNotif(anchor) {
  if (S.push.on || S.push.asked || pushSupport() !== 'ok' || !('Notification' in window) || Notification.permission !== 'default') return;
  const cs = lang() === 'cs';
  if (showTip({ key: 'notif', anchor, icon: tipBell(), title: cs ? 'Zapnout připomínky?' : 'Turn on reminders?', body: cs ? 'Upozornění přijde před tím, co máš v plánu, a když parťák něco odškrtne. Nic jiného.' : 'You get a nudge before what you planned and when a partner checks something off. Nothing else.', ok: cs ? 'Zapnout' : 'Turn on', no: cs ? 'Teď ne' : 'Not now', okFn: () => pushEnable() })) { S.push.asked = true; save(); }
}
/* hook: card sheet (first card) → Spolu tip on "S kým" tile */
(function () {
  const _ocs = openCardSheet;
  openCardSheet = function () { const r = _ocs.apply(this, arguments); setTimeout(() => { if (!SH.open || tipSeen('spolu')) return; const a = $('#sheet [data-a="kTile"][data-k="who"]'); a && tipSpolu(a); }, 900); return r; };
  const _upd = updAdd;
  updAdd = function () {
    const r = _upd.apply(this, arguments);
    if (typeof A === 'undefined' || !A || A.mode !== 'plan' || $('#tip')) return r;
    setTimeout(() => {
      if (!SH.open || $('#tip')) return;
      if (A.time) { const a = $('#sheet .lrw[data-k="rem"]'); if (a) { tipNotif(a); return; } }
      if ((A.text || '').trim().length > 2 && !tipSeen('spolu')) { const a = $('#sheet .lrw[data-k="partner"]'); a && tipSpolu(a); }
    }, 700);
    return r;
  };
})();
/* the old toast ask stays as a fallback only if the tip never showed */
const _maybeAskPush = maybeAskPush;
maybeAskPush = function () { if (tipSeen('notif')) return; return _maybeAskPush(); };

/* ---------- 3. beta feedback ---------- */
const FB = { kind: 'idea', text: '', img: null };
function fbServer() { return ((S.push && S.push.url) || PUSH_DEFAULT || '').trim().replace(/\/+$/, ''); }
function fbBody() {
  const cs = lang() === 'cs';
  const kinds = [['idea', cs ? 'Nápad' : 'Idea'], ['bug', cs ? 'Chyba' : 'Bug'], ['love', cs ? 'Pochvala' : 'Praise']];
  return '<div class="fbintro">' + esc(cs ? 'Co tě potěšilo, co drhne, co chybí? Jde to přímo autorovi.' : 'What made you smile, what is clunky, what is missing? It goes straight to the maker.') + '</div>'
    + '<div class="chips wrap fbk">' + kinds.map(([k, l]) => '<button class="chip ' + (FB.kind === k ? 'cr' : 'in') + ' press" data-a="fbKind" data-k="' + k + '">' + esc(l) + '</button>').join('') + '</div>'
    + '<label class="cap" for="fbText" style="display:block;margin:16px 4px 8px">' + esc(cs ? 'Zpráva' : 'Message') + '</label>'
    + '<div class="fld frost fbfld"><textarea id="fbText" rows="6" placeholder="' + esc(cs ? 'Např. chtěl bych widget na zamykací obrazovku…' : 'E.g. I would love a lock screen widget…') + '">' + esc(FB.text) + '</textarea></div>'
    + '<div class="fbimg">' + (FB.img ? '<span class="fbth" style="background-image:url(' + FB.img + ')"></span><button class="lnk" data-a="fbImgX">' + esc(cs ? 'Odebrat obrázek' : 'Remove image') + '</button>' : '<label class="chip in press fbpick">' + ico('photo', 15, 2) + esc(cs ? 'Přiložit screenshot' : 'Attach a screenshot') + '<input type="file" accept="image/*" id="fbFile"></label>') + '</div>'
    + '<div class="muted fbmeta">' + esc(cs ? 'Verze appky a typ zařízení se přidají samy.' : 'App version and device type are added automatically.') + '</div>';
}
function fbMount() {
  const ta = $('#fbText'); ta && ta.addEventListener('input', () => { FB.text = ta.value; const sv = $('#sheetSave'); if (sv) sv.disabled = FB.text.trim().length < 3; });
  const f = $('#fbFile'); f && f.addEventListener('change', async () => { const file = f.files && f.files[0]; if (!file) return; try { FB.img = await fbShrink(file); } catch (e) { FB.img = null; } fbRefresh(); });
}
function fbRefresh() { const sb = $('#sheet .sb'); if (!sb) return; const y = sb.scrollTop; sb.innerHTML = fbBody(); fbMount(); sb.scrollTop = y; const sv = $('#sheetSave'); if (sv) sv.disabled = FB.text.trim().length < 3; }
function fbShrink(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { const m = 1280, k = Math.min(1, m / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); let q = .72, d = c.toDataURL('image/jpeg', q); while (d.length > 560000 && q > .3) { q -= .12; d = c.toDataURL('image/jpeg', q); } res(d); }; im.onerror = rej; im.src = u; });
}
ACT.fbKind = el => { FB.kind = el.dataset.k; $$('#sheet .fbk .chip').forEach(b => { const on = b.dataset.k === FB.kind; b.classList.toggle('cr', on); b.classList.toggle('in', !on); }); };
ACT.fbImgX = () => { FB.img = null; fbRefresh(); };
ACT.feedback = () => {
  const cs = lang() === 'cs';
  openSheet({ title: 'Feedback', leftHTML: '<button class="xbtn in press" data-a="sheetCancel" aria-label="' + esc(t('cancel')) + '">' + ico('x', 16, 2.4) + '</button>', right: cs ? 'Odeslat' : 'Send', rightDisabled: FB.text.trim().length < 3, body: fbBody(), mount: fbMount, cls: 'addsheet fbsheet', dirty: () => FB.text.trim().length > 2, restore: () => ACT.feedback(), onSave: fbSend });
  setTimeout(() => { const ta = $('#fbText'); ta && ta.focus(); }, 380);
};
async function fbSend() {
  const cs = lang() === 'cs'; const sv = $('#sheetSave'); const url = fbServer();
  if (!url) { toast(esc(cs ? 'Chybí adresa serveru' : 'Server address missing')); return; }
  if (sv) { sv.disabled = true; sv.textContent = cs ? 'Odesílám…' : 'Sending…'; }
  const body = { kind: FB.kind, text: FB.text.trim().slice(0, 4000), img: FB.img, name: (S.name || '').trim().slice(0, 60), ver: VERSION + (window.AUR_NS ? '-test' : ''), lang: S.lang,
    meta: { ua: navigator.userAgent.slice(0, 300), w: innerWidth, h: innerHeight, dpr: devicePixelRatio, standalone: isStandalone(), layout: document.body.classList.contains('desk') ? 'desk' : 'mobile', cards: S.cards.length, items: S.items.length, shared: (S.shared || []).length, push: !!(S.push && S.push.on) } };
  try {
    const r = await fetch(url + '/fb', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || r.status);
    FB.text = ''; FB.img = null; FB.kind = 'idea';
    closeSheet(true); toast(esc(cs ? 'Díky! Zpráva odešla.' : 'Thanks! Message sent.'));
  } catch (e) {
    if (sv) { sv.disabled = false; sv.textContent = cs ? 'Odeslat' : 'Send'; }
    toast(esc(cs ? 'Nepodařilo se odeslat. Zkus to znovu.' : 'Could not send. Try again.'));
  }
}
