/* ============ v19.1 · first visit to a screen: one small hint bubble, once ============
   Apple-style help in context instead of a long tour: one bubble per screen, only the first time,
   never two at once, never over the onboarding or an open sheet. Phone layout only. */

const COACH = {
  home: { place: 'over', sel: ['#hstack'], cs: ['Swipni nahoru', 'Pod obloukem je víc: tvůj týden, Spolu, tip dne a večer shrnutí.'], en: ['Swipe up', 'There is more under the arc: your week, Together, a tip and an evening summary.'] },
  spaces: { sel: ['#s-spaces .deck > *'], cs: ['Tvoje karty', 'Listuj do strany. Klepnutím kartu otevřeš a uvidíš sérii.'], en: ['Your cards', 'Swipe sideways. Tap a card to open it and see your streak.'] },
  board: { sel: ['#s-board .mt', '#s-board .pbtn'], cs: ['Zeď pro nápady', 'Hoď sem fotku, video nebo poznámku. Klepnutím ji otevřeš na celou obrazovku.'], en: ['A wall for ideas', 'Drop a photo, video or note here. Tap to open it full screen.'] },
  plan: { sel: ['#s-plan .seg'], cs: ['Den, týden, měsíc', 'Přepni nahoře pohled. V Týdnu hned vidíš, kde máš volno.'], en: ['Day, week, month', 'Switch the view at the top. Week shows where you have room.'] },
  card: { sel: ['#s-card .heat', '#s-card .hero'], cs: ['Klepni na den', 'V rytmu klepnutím na den zpětně označíš, že jsi to dal.'], en: ['Tap a day', 'Tap a day in the rhythm to mark it done after the fact.'] },
  add: { sel: ['#aText'], cs: ['Piš větou', 'Třeba „trénink po st pá v 18“. Den, čas i opakování se doplní samy.'], en: ['Just type it', 'Like “gym mon wed fri at 6pm”. Day, time and repeat fill in by themselves.'] }
};
function coachAnchor(sels) {
  for (const s of sels) for (const el of document.querySelectorAll(s)) { const r = el.getBoundingClientRect(); if (r.height > 0 && r.top >= 0 && r.bottom <= innerHeight - 8) return el; }
  return null;
}
function coach(k, delay = 700, tries = 3) {
  if (!S || !S.onboarded || (typeof DESK !== 'undefined' && DESK.on) || tipSeen('cm_' + k)) return;
  clearTimeout(COACH._t);
  COACH._t = setTimeout(() => {
    const busy = $('#tip') || $('#launch') || $('#promo') || $('#install') || ($('#welcome') && $('#welcome').classList.contains('on')) || (k !== 'add' && typeof SH !== 'undefined' && SH.open) || $('#viewer.on') || $('#vlayer.on')
      || V.settingsOpen || (k !== 'card' && k !== 'add' && V.card) || (['home', 'spaces', 'board', 'plan'].includes(k) && V.tab !== k);
    if (busy) { if (tries > 0) coach(k, 2500, tries - 1); return; }
    const c = COACH[k], a = coachAnchor(c.sel); if (!a) return;
    const L = lang() === 'cs' ? c.cs : c.en;
    if (!showTip({ key: 'cm_' + k, anchor: a, title: L[0], body: L[1], ok: lang() === 'cs' ? 'Rozumím' : 'Got it', place: c.place })) return;
    if (k === 'home') tipMark('stackHint');
    /* v19.2: a bubble that vanished before anyone could read it (a stray tap, a quick tab switch) comes back next time */
    const el = $('#tip'), t0 = Date.now(); if (!el) return;
    const ok = el.querySelector('[data-x=ok]'); ok && ok.addEventListener('click', () => { el._ok = 1; });
    const mo = new MutationObserver(() => { if (document.body.contains(el)) return; mo.disconnect();
      if (!el._ok && Date.now() - t0 < 2500 && S.tips) { delete S.tips['cm_' + k]; save(); } });
    mo.observe(document.body, { childList: true });
  }, delay);
}
/* v19.1: the step-by-step tutorial lives on Board as a pinned video, once; people delete it when they are done */
function seedTutorial() {
  if (!S || !S.onboarded || (S.tips && S.tips.tutBoard) || !Array.isArray(S.moments)) return false;
  S.tips = S.tips || {}; S.tips.tutBoard = Date.now();
  if (!S.moments.some(m => m.sys === 'tutorial')) S.moments.unshift({ id: uid(), sys: 'tutorial', kind: 'video', card: null, pin: true, note: lang() === 'cs' ? 'Jak Aurora funguje · video' : 'How Aurora works · video', d: T(), ts: Date.now(), img: 'url:tutorial.mp4?v=4', thumb: 'url:tutorial-thumb.jpg?v=4', r: 1.3, dur: TUT_DUR });
  save(); return true;
}
const TUT_DUR = 72;
{
  const drop = () => { if ($('#tip') && typeof closeTip === 'function') closeTip(); };
  const _go = go; go = function (tab) { if (tab !== V.tab) drop(); if (tab === 'board') seedTutorial(); const r = _go.apply(this, arguments); if (COACH[tab]) coach(tab); return r; };
  const _oc = openCard; openCard = function () { drop(); const r = _oc.apply(this, arguments); coach('card', 900); return r; };
  const _oa = openAdd; openAdd = function (o) { const r = _oa.apply(this, arguments); if (!o || o.mode !== 'note') coach('add', 1000); return r; };
  const _hw = hideWelcome; hideWelcome = function () { const r = _hw.apply(this, arguments); seedTutorial(); coach('home', 1600); return r; };
  const _os = openSettings; openSettings = function () { drop(); return _os.apply(this, arguments); }; ACT.openSettings = openSettings;
  addEventListener('aurlaunch', () => { coach('home', 1400); setTimeout(() => { if (seedTutorial() && V.tab === 'board') render(); }, 1500); });
  addEventListener('aurpromo', () => coach('home', 1200));
}
ACT.coachReset = () => { S.tips = S.tips || {}; Object.keys(COACH).forEach(k => { delete S.tips['cm_' + k]; }); delete S.tips.stackHint; save(); toast(esc(lang() === 'cs' ? 'Nápověda se znovu ukáže na každé obrazovce' : 'Hints will show again on each screen')); };
