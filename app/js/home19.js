/* ============ v19 · Home: the day as an arc, one Done, and a stack of overview cards ============
   Home is an overview. Ticking things off lives in Plan and in the cards; Home keeps one Done for
   the thing that is next. Shared by the phone Home (renderHome) and the left panel on the desktop. */

const L2 = (cs, en) => lang() === 'cs' ? cs : en;
const H19 = { idx: 0, order: [], hintT: null };

/* ---------- the arc: 06 → 24 ---------- */
function arcSVG(M, w = 326, h = 150) {
  const t01 = m => Math.min(1, Math.max(0, (m - 360) / 1080));
  const cx = w / 2, cy = h - 8, R = Math.min(w / 2 - 22, h - 22);
  const P = m => { const a = Math.PI - t01(m) * Math.PI; return [cx + R * Math.cos(a), cy - R * Math.sin(a)]; };
  const arc = (m1, m2) => { const [x1, y1] = P(m1), [x2, y2] = P(Math.max(m1 + 1, m2)); return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1); };
  let s = '<svg class="harc" viewBox="0 0 ' + w + ' ' + h + '" width="100%" aria-hidden="true">';
  s += '<path d="' + arc(360, 1440) + '" fill="none" stroke="rgba(243,234,216,.2)" stroke-width="1.3" stroke-dasharray="1 5" stroke-linecap="round"/>';
  s += '<path d="' + arc(360, Math.min(1440, M.nm)) + '" fill="none" stroke="rgba(243,234,216,.8)" stroke-width="1.6" stroke-linecap="round"/>';
  M.arcs.forEach((a, k) => { s += '<path class="arcI ' + a.st + '" data-a="peek" data-k="' + k + '" d="' + arc(a.s, Math.min(1440, a.e)) + '" fill="none" stroke="' + a.c + '" stroke-opacity="' + (a.st === 'past' ? .45 : 1) + '" stroke-width="7" stroke-linecap="round"/>'; });
  if (M.nm >= 360 && M.nm <= 1440) { const [nx, ny] = P(M.nm); s += '<line x1="' + nx.toFixed(1) + '" y1="' + ny.toFixed(1) + '" x2="' + nx.toFixed(1) + '" y2="' + cy + '" stroke="rgba(243,234,216,.32)" stroke-width="1" stroke-dasharray="2 3"/><circle class="nowd" cx="' + nx.toFixed(1) + '" cy="' + ny.toFixed(1) + '" r="7" fill="#fff6ec"/>'; }
  [[6, '06'], [12, '12'], [18, '18'], [24, '24']].forEach(([hh, l]) => { const [x, y] = P(hh * 60); s += '<text x="' + x.toFixed(1) + '" y="' + (hh === 6 || hh === 24 ? y + 18 : y - 11).toFixed(1) + '" text-anchor="middle" font-family="Inter" font-size="10" fill="rgba(243,234,216,.55)">' + l + '</text>'; });
  return s + '</svg>';
}
/* what sits in the middle of the arc: what is next (or what runs now) */
const shortT = t => (t || '').split(' — ')[0].trim();
function centerModel(M) {
  const nx = M.nextAny; const card = nx && nx.card && cardById(nx.card) ? cardById(nx.card).name : '';
  if (nx && nx.time) {
    const s = tmin(nx.time), e = s + (nx.dur || 45);
    if (s <= M.nm && M.nm < e) return { k: L2('teď', 'now'), live: true, t: shortT(nx.t), s: [L2('běží · ještě ', 'on · ') + fmtDur(e - M.nm) + L2('', ' left'), card].filter(Boolean).join(' · ') };
    return { k: L2('další', 'next'), t: shortT(nx.t), s: [L2('v ', 'at ') + nx.time, card].filter(Boolean).join(' · ') };
  }
  if (nx) return { k: L2('další', 'next'), t: shortT(nx.t), s: [L2('kdykoli dnes', 'any time today'), card].filter(Boolean).join(' · ') };
  if (M.list.length) return { k: '', t: L2('Všechno hotovo', 'All done'), s: M.doneN + ' / ' + M.list.length + ' ✓' };
  return { k: '', t: L2('Volný den', 'Free day'), s: L2('Klepni na + a přidej si něco.', 'Tap + to add something.') };
}
function weekRow(d) {
  const L = lang() === 'cs' ? ['P', 'Ú', 'S', 'Č', 'P', 'S', 'N'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return '<div class="hwk">' + weekDays(d).map((x, k) => { const f = x < d && completionsOn(x) > 0; return '<button class="press' + (x === d ? ' t' : f ? ' f' : '') + '" data-a="homeDay" data-d="' + x + '" aria-label="' + esc(dayShort(x)) + '">' + L[k] + '</button>'; }).join('') + '</div>';
}
function h19Top(M) {
  const C = centerModel(M), nx = M.nextAny;
  const len = (C.t || '').length, long = len > 13 ? (len > 20 ? ' long xl' : ' long') : '';
  const done = nx
    ? '<button class="fp frost press hdone" data-a="homeDone" data-id="' + nx.id + '"><span class="ic">' + ico('check', 18, 2.4) + '</span>' + esc(t('done')) + '</button>'
    : '<button class="fp frost press hdone" data-a="add" data-ctx="today"><span class="ic">' + ico('plus', 18, 2.4) + '</span>' + esc(t('addForToday')) + '</button>';
  return '<div class="fh"><div><span class="t">' + esc(t('today')) + '</span></div><span class="s">' + esc(dayShort(M.d)) + ' · ' + (M.list.length ? t('ofDone', '<b>' + M.doneN + '</b>', M.list.length) : esc(t('nothingToday'))) + '</span></div>'
    + '<div class="harcw" id="dialw">' + arcSVG(M)
    + '<button class="hctr press" data-a="' + (nx ? 'openItem' : 'orbTap') + '"' + (nx ? ' data-id="' + nx.id + '"' : '') + '>'
    + (C.k ? '<span class="hk' + (C.live ? ' live' : '') + '" id="orbK">' + (C.live ? '<i></i>' : '') + esc(C.k) + '</span>' : '<span class="hk" id="orbK"></span>')
    + '<span class="ht' + long + '" id="orbN">' + esc(C.t) + '</span><span class="hs" id="orbS">' + esc(C.s) + '</span></button></div>'
    + weekRow(M.d) + '<div class="prow">' + done + '</div>';
}

/* ---------- the stack under the arc ---------- */
function stripRow(html, d) { return html.replace(/<button class="c0[\s\S]*?<\/button>/, '<span class="chev">' + ico('chev', 14, 2.2) + '</span>').replace(/data-a="openItem" data-id="[^"]*"/, 'data-a="homeDay" data-d="' + d + '"'); }
function cardPak(M) {
  const rest = M.list.filter(i => !isDone(i, M.d) && i !== M.nextAny);
  const rows = rest.slice(0, 3).map(i => stripRow(trow(i, i.date && i.date < M.d && !i.repeat ? i.date : M.d, null), M.d)).join('');
  const more = rest.length > 3 ? L2('a další ' + (rest.length - 3) + ' v Plánu', '+' + (rest.length - 3) + ' more in Plan') : L2('Celý den v Plánu', 'Whole day in Plan');
  return '<div class="lh"><span class="cap">' + esc(t('then')) + '</span><span class="muted">' + (rest.length ? esc(t('leftN', rest.length)) : '') + '</span></div>'
    + (rows || '<div class="hempty">' + esc(M.list.length ? t('nothingElse') : L2('Dnes nic naplánováno.', 'Nothing planned today.')) + '</div>')
    + '<button class="hmore press" data-a="homeDay" data-d="' + M.d + '">' + esc(more) + ico('chev', 14, 2.2) + '</button>';
}
function cardWeek(M) {
  const days = weekDays(M.d); const vals = days.map(x => x <= M.d ? completionsOn(x) : 0); const mx = Math.max(1, ...vals);
  const tot = days.reduce((a, x) => a + itemsOn(x).length, 0), dn = vals.reduce((a, b) => a + b, 0);
  const L = lang() === 'cs' ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const bars = days.map((x, k) => '<span class="hb' + (x === M.d ? ' t' : '') + '"><i class="' + (vals[k] ? 'f' : '') + '" style="height:' + (x > M.d ? 12 : Math.max(12, Math.round(vals[k] / mx * 100))) + '%"></i><small>' + L[k] + '</small></span>').join('');
  const habits = S.cards.filter(c => c.type === 'habit').map(c => ({ c, s: streakOf(c.id), w: habitWeek(c.id).filter(Boolean).length })).sort((a, b) => b.s - a.s || b.w - a.w).slice(0, 2);
  const chips = habits.map(h => '<button class="hchip press" data-a="openCard" data-id="' + h.c.id + '" style="--c:' + h.c.color + '"><i></i>' + esc(h.c.name) + ' · ' + (h.s >= 2 ? L2('série ' + h.s, h.s + '-day streak') : h.w + '/' + goalOf(h.c)) + '</button>').join('');
  return '<div class="lh"><span class="cap">' + esc(L2('Tvůj týden', 'Your week')) + '</span><span class="muted">' + esc(L2(dn + ' z ' + tot + ' hotovo', dn + ' of ' + tot + ' done')) + '</span></div><div class="hbars">' + bars + '</div>' + (chips ? '<div class="hchips">' + chips + '</div>' : '');
}
/* the newest thing a partner did (from the shared spaces' news) */
function spoluNews() {
  if (typeof chs !== 'function') return null;
  const me = meId(); let best = null;
  for (const ch of chs()) for (const a of ch.act || []) {
    if (a.who === me || !['add', 'done', 'join', 'photo', 'note'].includes(a.k)) continue;
    if (Date.now() - (a.ts || 0) > 4 * 864e5) continue;
    if (!best || a.ts > best.a.ts) best = { a, ch };
  }
  if (!best) return null;
  const m = members(best.ch).find(x => x.id === best.a.who) || { name: '?', ini: '?', color: '#9fb3c4' };
  return Object.assign(best, { m, it: best.a.iid ? itemById(best.a.iid) : null, seen: best.a.ts <= (S.newsSeen || 0) || Date.now() - best.a.ts > 12 * 36e5 });
}
function cardSpolu(N) {
  const a = N.a, it = N.it, cs = lang() === 'cs';
  const verb = { add: cs ? 'přidává' : 'added', done: cs ? 'má hotovo' : 'is done', join: cs ? 'je teď v kartě' : 'joined', photo: cs ? 'přidává fotku' : 'added a photo', note: cs ? 'přidává nápad' : 'added an idea' }[a.k];
  const when = it ? [it.t, it.date ? dayShort(it.date) : '', it.time || ''].filter(Boolean).join(' · ') : (a.t || '');
  const btn = it && it.date ? '<button class="hbtn press" data-a="homeDay" data-d="' + it.date + '">' + esc(L2('Otevřít v Plánu', 'Open in Plan')) + '</button>'
    : N.ch.kind === 'card' ? '<button class="hbtn press" data-a="openCard" data-id="' + N.ch.ref + '">' + esc(L2('Otevřít kartu', 'Open card')) + '</button>' : '';
  return '<div class="lh"><span class="cap">' + esc(L2('Spolu', 'Together')) + '</span><span class="muted">' + esc(agoText(a.ts)) + '</span></div>'
    + '<div class="hrow">' + avHTML(N.m, 46) + '<span><b class="hrt">' + esc(N.m.name + ' ' + verb) + '</b><small class="hrs">' + esc(when) + '</small></span></div>' + btn;
}
function cardTip(tp) {
  return '<div class="lh"><span class="cap">' + esc(L2('Tip', 'Tip')) + '</span><button class="hx press" data-a="tipNext" aria-label="' + esc(L2('Další tip', 'Next tip')) + '">' + ico('x', 14, 2.4) + '</button></div>'
    + '<div class="hbig">' + esc(tp.h) + '</div><div class="hp">' + esc(tp.b) + '</div>'
    + (tp.act ? '<button class="hbtn ghost press" data-a="tipAct" data-k="' + tp.act + '">' + esc(tp.btn || L2('Vyzkoušet', 'Try it')) + '</button>' : '');
}
function boardPick() {
  const ms = S.moments.filter(m => m.kind !== 'link' && !(m.planned && itemById(m.planned)));
  if (!ms.length) return null;
  const pins = ms.filter(m => m.pin); const pool = pins.length ? pins : ms;
  return pool[(+T().replace(/-/g, '')) % pool.length];
}
function cardBoard(m) {
  const age = Math.max(0, daysBetween(m.d || T(), T()));
  const img = m.kind === 'note' ? '<span class="himg note" style="--c:' + cardColor(m.card) + '">' + esc((m.note || '').slice(0, 40)) + '</span>' : '<span class="himg" style="background-image:url(' + (mediaNow(m.thumb) || mediaNow(m.img) || '') + ')"></span>';
  return '<div class="lh"><span class="cap">' + esc(L2('Z Boardu', 'From Board')) + '</span><span class="muted">' + esc(m.pin ? L2('připnuto', 'pinned') : L2('nápad', 'idea')) + '</span></div>'
    + '<button class="hrow press" data-a="viewMoment" data-id="' + m.id + '" style="align-items:flex-start">' + img + '<span><b class="hrt">' + esc(m.note || m.title || L2('Bez popisku', 'No caption')) + '</b><small class="hrs">' + esc(age ? L2('Leží tu ' + age + (age === 1 ? ' den' : age < 5 ? ' dny' : ' dní') + '.', 'Here for ' + age + ' day' + (age === 1 ? '' : 's') + '.') : L2('Přidáno dnes.', 'Added today.')) + '</small><span class="hchip" style="--c:#f0a44b;margin-top:12px"><i></i>' + esc(L2('Naplánovat', 'Plan it')) + '</span></span></button>';
}
function cardEvening(M) {
  const left = M.list.filter(i => !isDone(i, M.d)); const n = M.list.length, dn = M.doneN;
  const big = !n ? L2('Klidný den.', 'A quiet day.') : !left.length ? L2('Všechno hotovo. Skvělý den.', 'All done. Great day.') : dn ? L2(dn + ' ze ' + n + '. Dobrý den.', dn + ' of ' + n + '. Good day.') : L2('Dnes nic. Zítra je nový den.', 'Not today. Tomorrow is new.');
  const list = M.list.slice(0, 4).map(i => esc(i.t) + (isDone(i, M.d) ? ' ✓' : '')).join(' · ');
  const movable = left.filter(i => !i.repeat);
  return '<div class="lh"><span class="cap">' + esc(L2('Večer', 'Evening')) + '</span><span class="muted">' + esc(dayShort(M.d)) + '</span></div><div class="hbig">' + esc(big) + '</div>' + (list ? '<div class="hp">' + list + '</div>' : '')
    + (movable.length ? '<button class="hbtn press" data-a="moveRest">' + esc(L2('Přesunout zbytek na zítra', 'Move the rest to tomorrow')) + '</button>' : '');
}
function stackCards(M) {
  const h = new Date().getHours(); const N = spoluNews(); const tp = tipToday(); const bm = boardPick();
  const c = { pak: cardPak(M), week: cardWeek(M) };
  const at = typeof accTip === 'function' ? accTip() : null; if (at) c.acc = cardAcc(at);
  if (N) c.spolu = cardSpolu(N); if (tp) c.tip = cardTip(tp); if (bm) c.board = cardBoard(bm); if (h >= 18) c.eve = cardEvening(M);
  let order = h >= 18 ? (N && !N.seen ? ['spolu', 'eve', 'pak', 'week', 'tip', 'board'] : ['eve', 'pak', 'week', 'spolu', 'tip', 'board']) : N && !N.seen ? ['spolu', 'pak', 'week', 'tip', 'board'] : ['pak', 'week', 'tip', 'spolu', 'board'];
  if (c.acc) order.unshift('acc');
  order = order.filter(k => c[k]);
  return { order, html: order.map(k => c[k]), news: N };
}
function h19StackHTML(M) {
  const S2 = stackCards(M); H19.order = S2.order; H19.news = S2.news;
  return '<section class="hstack" id="hstack"><div class="hst" id="hst" tabindex="0" aria-label="' + esc(L2('Přehled, posuň nahoru nebo dolů', 'Overview, scroll up or down')) + '">'
    + S2.html.map((h, k) => '<div class="hcard frost solid" data-k="' + S2.order[k] + '">' + h + '</div>').join('')
    + '</div><div class="hdots">' + S2.order.map((_, k) => '<i' + (k === H19.idx ? ' class="on"' : '') + '></i>').join('') + '</div></section>';
}
/* sizes the stack to the room that is left, keeps its page, and marks news as seen */
function h19Mount(root, fill) {
  const st = root.querySelector('#hstack'), sc = root.querySelector('#hst'); if (!st || !sc) return;
  if (fill) {
    const pad = parseFloat(getComputedStyle(root).paddingBottom) || 0;
    const room = root.clientHeight - (st.getBoundingClientRect().top - root.getBoundingClientRect().top) - pad + 24;
    st.style.height = Math.round(Math.max(196, Math.min(360, room))) + 'px';
  }
  const page = () => sc.clientHeight + 12;
  const k = Math.min(H19.idx, H19.order.length - 1); H19.idx = Math.max(0, k);
  sc.scrollTop = H19.idx * page();
  const dots = [...st.querySelectorAll('.hdots i')];
  /* news stays on top until it is opened (or 12 h pass), so the stack does not reshuffle under your thumb */
  const sp = st.querySelector('.hcard[data-k="spolu"]'); if (sp && H19.news) sp.addEventListener('click', () => { S.newsSeen = H19.news.a.ts; save(); }, true);
  let raf = 0;
  sc.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const i = Math.round(sc.scrollTop / page()); if (i !== H19.idx) { H19.idx = i; dots.forEach((d, j) => d.classList.toggle('on', j === i)); } }); }, { passive: true });
  sc.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sc.scrollTo({ top: (H19.idx + (e.key === 'ArrowDown' ? 1 : -1)) * page(), behavior: RM ? 'auto' : 'smooth' }); } });
  /* first visit: the tile nudges up once, so people see there is more under it */
  if (!(S.tips && S.tips.stackHint) && H19.order.length > 1 && !RM) {
    clearTimeout(H19.hintT);
    H19.hintT = setTimeout(() => { if (!sc.isConnected || H19.idx) return; sc.scrollTo({ top: 54, behavior: 'smooth' }); setTimeout(() => sc.scrollTo({ top: 0, behavior: 'smooth' }), 520); S.tips = S.tips || {}; S.tips.stackHint = Date.now(); save(); }, 1400);
  }
}

/* ---------- Home ---------- */
function renderHome() {
  const M = homeModel(); const el = $('#s-home');
  el.innerHTML = '<div class="hdr"><img class="logo" src="logo.svg" alt="aurora"><button class="cb frost press" data-a="openSettings" aria-label="' + esc(t('settings')) + '">' + ico('gear', 21, 1.8) + '</button></div>'
    + '<div class="stack"><section class="inst big frost h19">' + h19Top(M) + '</section>' + h19StackHTML(M) + '</div>';
  el._arcs = M.arcs;
  h19Mount(el, true);
  auraFromCards(M.nextAny && M.nextAny.card ? cardColor(M.nextAny.card) : null);
}
ACT.peek = el => {
  const root = el.closest('.h19') || document; const arcs = (el.closest('.phnow') || $('#s-home'))._arcs || $('#s-home')._arcs;
  const a = arcs && arcs[+el.dataset.k]; if (!a) return;
  const K = root.querySelector('.hk'), N = root.querySelector('.ht'), Sb = root.querySelector('.hs');
  clearTimeout(peekT); const it = itemById(a.id); const c = it && it.card && cardById(it.card) ? cardById(it.card).name : '';
  swapText(K, a.time); swapText(N, a.t); swapText(Sb, [it && isDone(it, T()) ? L2('hotovo ✓', 'done ✓') : '', c].filter(Boolean).join(' · ') || ' ');
  if (!RM) el.animate([{ strokeWidth: 7 }, { strokeWidth: 12 }, { strokeWidth: 7 }], { duration: 650, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  peekT = setTimeout(() => { const C = centerModel(homeModel()); swapText(K, C.k); swapText(N, C.t); swapText(Sb, C.s); }, 2400);
};
ACT.homeDay = el => { const d = el.dataset.d || T(); V.planDay = d; V.planWeek = weekStart(d); V.planMode = 'list'; go('plan'); };
ACT.moveRest = () => {
  const d = T(), to = addD(d, 1); const moved = S.items.filter(i => !i.repeat && i.date === d && !i.done);
  moved.forEach(i => i.date = to); save(); render();
  toast(esc(L2('Přesunuto na zítra: ' + moved.length, 'Moved to tomorrow: ' + moved.length)), { label: t('undo'), fn: () => { moved.forEach(i => i.date = d); save(); render(); } });
};
