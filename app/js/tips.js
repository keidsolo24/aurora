/* ============ v19 · Tips: one a day on Home, never a motivational quote ============
   App tips disappear once the feature has been used. Habit tips are short and practical.
   Situational ones (a broken streak) jump the queue. Off in Settings → Tipy na Domově. */

const TIPS = [
  { id: 'veta', cs: ['Piš větou.', 'Napiš „každé út a čt v 18“ a Aurora to rozplánuje sama.'], en: ['Just type it.', 'Write “every tue and thu at 6pm” and Aurora plans it for you.'], act: 'add', used: () => S.items.some(i => i.repeat === 'days' || i.repeat === 'weekdays') },
  { id: 'malykrok', cs: ['Začni směšně malým krokem.', 'Dvě kliky místo dvaceti. Hlavně ať se to stane každý den.'], en: ['Start ridiculously small.', 'Two push-ups instead of twenty. What matters is that it happens.'] },
  { id: 'oblouk', cs: ['Klepni na oblouk.', 'Barevné kousky oblouku jsou tvoje plány. Klepnutím uvidíš, co který je.'], en: ['Tap the arc.', 'The coloured bits of the arc are your plans. Tap one to see what it is.'] },
  { id: 'spoj', cs: ['Spoj to s něčím, co už děláš.', 'Po ranní kávě deset minut čtení. Starý zvyk táhne nový.'], en: ['Stack it on something you already do.', 'Ten minutes of reading after your morning coffee. The old habit pulls the new one.'] },
  { id: 'zitra', cs: ['„Zítra v 10“ stačí.', 'Datum i čas se doplní samy. Funguje i „pá 14:00“.'], en: ['“Tomorrow at 10” is enough.', 'Date and time fill in by themselves. “Fri 2pm” works too.'], act: 'add' },
  { id: 'stejnycas', cs: ['Stejný čas, stejné místo.', 'Návyk se chytí rychleji, když má v dni pevné místo.'], en: ['Same time, same place.', 'A habit sticks faster when it has a fixed spot in your day.'] },
  { id: 'napad', cs: ['Nápad hned na Board.', 'V přidávání přepni na Nápad. Naplánuješ ho, až budeš chtít.'], en: ['Ideas go straight to Board.', 'Switch to Idea when adding. Plan it whenever you like.'], act: 'note', used: () => S.moments.some(m => m.kind === 'note') },
  { id: 'dvaminuty', cs: ['Pravidlo dvou minut.', 'Co zabere do dvou minut, udělej hned. Co ne, hoď do Aurory.'], en: ['The two-minute rule.', 'If it takes under two minutes, do it now. If not, put it in Aurora.'] },
  { id: 'spolukarta', cs: ['Ve dvou se to drží líp.', 'Otevři kartu a pozvi parťáka. Uvidíte navzájem, kdo dnes dal.'], en: ['It sticks better together.', 'Open a card and invite a partner. You both see who did it today.'], act: 'spaces', used: () => (S.shared || []).length > 0 },
  { id: 'pripravit', cs: ['Připrav si to večer.', 'Boty u dveří, kniha na polštáři. Ráno pak nemusíš přemýšlet.'], en: ['Set it up the night before.', 'Shoes by the door, book on the pillow. No thinking needed in the morning.'] },
  { id: 'spoluplan', cs: ['Plán s někým.', 'U jedné věci klepni na „Chceš přidat parťáka?“. Sdílí se jen ta jedna věc.'], en: ['Plan it with someone.', 'On a single item tap “Add a partner?”. Only that one thing is shared.'], act: 'add', used: () => S.items.some(i => i.ish) },
  { id: 'jednavec', cs: ['Jedna věc najednou.', 'Na Domově je vždycky jen ta další. Zbytek počká v Plánu.'], en: ['One thing at a time.', 'Home only ever shows the next thing. The rest waits in Plan.'] },
  { id: 'tyden', cs: ['Týden na jednom místě.', 'V Plánu přepni na Týden. Hned uvidíš, kde máš volno.'], en: ['Your week in one place.', 'Switch Plan to Week. You will see where you have room.'], act: 'plan' },
  { id: 'odmena', cs: ['Odškrtnutí je odměna.', 'Nech si tu vteřinu. Mozek si zapamatuje, že to stálo za to.'], en: ['Ticking it off is the reward.', 'Enjoy that second. Your brain remembers it was worth it.'] },
  { id: 'cil', cs: ['Cíl, který zvládneš.', 'Radši 3× týdně a dodržet, než 7× a vzdát to ve středu.'], en: ['A goal you can keep.', 'Three times a week and keep it beats seven and quitting on Wednesday.'] },
  { id: 'nedele', cs: ['Neděle na plán.', 'Pět minut v neděli večer a celý týden máš v klidu.'], en: ['Sunday is for planning.', 'Five minutes on Sunday evening and the whole week feels calm.'] },
  { id: 'opakovat', cs: ['Jen některé dny.', 'Opakovat → Vybrané dny. Třeba P, Ú a Č na trénink.'], en: ['Only some days.', 'Repeat → Selected days. Mon, Tue and Thu for training, say.'], act: 'add' },
  { id: 'mene', cs: ['Míň je víc.', 'Tři důležité věci za den stačí. Zbytek je bonus.'], en: ['Less is more.', 'Three things that matter are enough for a day. The rest is a bonus.'] },
  { id: 'pripomenout', cs: ['Připomínka včas.', 'Věc s časem ti může připomenout 10 minut předem. Zapni notifikace v Nastavení.'], en: ['A reminder in time.', 'A timed item can remind you 10 minutes before. Turn on notifications in Settings.'], act: 'settings', used: () => !!(S.push && S.push.on) },
  { id: 'pauza', cs: ['Pauza se počítá.', 'Naplánuj si i volno. Odpočinek je taky krok.'], en: ['Rest counts.', 'Plan your time off too. Resting is a step as well.'] },
  { id: 'foto', cs: ['Fotky k věcem.', 'Na Board můžeš hodit fotku nebo video. Ukáže se i v kartě.'], en: ['Photos for your things.', 'Drop a photo or video on Board. It shows up in the card too.'], act: 'photo', used: () => S.moments.some(m => m.kind === 'photo' || m.kind === 'video') },
  { id: 'hned', cs: ['Napiš to hned.', 'Nápad z tramvaje do minuty zmizí. Hoď ho na Board.'], en: ['Write it down now.', 'An idea from the tram is gone in a minute. Put it on Board.'] },
  { id: 'mesic', cs: ['Celý měsíc.', 'Přepni Plán na Měsíc. Zelené dny jsou ty, kdy jsi něco dal.'], en: ['The whole month.', 'Switch Plan to Month. Green days are the ones you got something done.'], act: 'plan' },
  { id: 'nahlas', cs: ['Řekni to nahlas.', 'Kdo o tvém cíli ví, ten se zeptá. A to pomáhá.'], en: ['Say it out loud.', 'People who know your goal will ask about it. That helps.'] },
  { id: 'deadline', cs: ['Projekt s termínem.', 'U projektu nastav deadline. Karta ukáže, kolik dní zbývá.'], en: ['A project with a deadline.', 'Give a project a deadline. Its card shows how many days are left.'], act: 'newCard', used: () => S.cards.some(c => c.deadline) },
  { id: 'spanek', cs: ['Den začíná večer.', 'Nejlepší ráno si připravíš tím, že jdeš včas spát.'], en: ['The day starts the night before.', 'The best morning starts with going to bed on time.'] },
  { id: 'delka', cs: ['Kolik to zabere?', 'U věci s časem nastav délku. Na oblouku uvidíš, jak je den nabitý.'], en: ['How long will it take?', 'Give timed items a length. The arc shows how full the day is.'] },
  { id: 'kdykoli', cs: ['Bez času je taky čas.', 'Věc bez času spadne do „kdykoli dnes“. Udělej ji, až se to hodí.'], en: ['No time is fine too.', 'An item without a time is “any time today”. Do it when it fits.'] },
  { id: 'zpet', cs: ['Překlik? Zpět.', 'Po odškrtnutí se na chvíli ukáže Zpět. Nic není napořád.'], en: ['Mis-tap? Undo.', 'After ticking something off, Undo shows for a moment. Nothing is final.'] },
  { id: 'vecer', cs: ['Nestihl jsi? Nevadí.', 'Večer ti Aurora nabídne přesunout zbytek na zítra jedním klepnutím.'], en: ['Did not get to it? Fine.', 'In the evening Aurora offers to move the rest to tomorrow in one tap.'] },
  { id: 'plocha', cs: ['Aurora na ploše.', 'Z ikony na ploše běží přes celou obrazovku, offline a s notifikacemi.'], en: ['Aurora on your Home Screen.', 'From the icon it runs full screen, offline and with notifications.'], act: 'install', used: () => isStandalone() || document.body.classList.contains('desk') },
  { id: 'pc', cs: ['I na počítači.', 'Otevři Auroru na PC a propoj ji kódem: Nastavení → Synchronizace.'], en: ['On your computer too.', 'Open Aurora on your PC and link it with a code: Settings → Sync.'], act: 'settings', used: () => !!(S.sync && S.sync.on) },
  { id: 'zaloha', cs: ['Záloha jedním klepnutím.', 'Data máš jen u sebe. Nastavení → Exportovat zálohu, a máš je i jinde.'], en: ['Back up in one tap.', 'Your data lives on your device. Settings → Export backup keeps a copy.'], act: 'settings' },
  { id: 'video', cs: ['Aurora za minutu.', 'Na Boardu máš video, jak to celé funguje. Pak ho klidně smaž.'], en: ['Aurora in a minute.', 'Your Board has a video on how it all works. Delete it when you are done.'], act: 'tutorial', btn: ['Pustit video', 'Play video'] },
  { id: 'feedback', cs: ['Řekni, co drhne.', 'Nastavení → Napsat feedback. Klidně se screenshotem, každá zpráva se čte.'], en: ['Tell us what is off.', 'Settings → Send feedback. A screenshot helps, every message is read.'], act: 'feedback', btn: ['Napsat feedback', 'Send feedback'] },
  { id: 'stack', cs: ['Tahle dlaždice má víc stran.', 'Swipni nahoru: týden, Spolu, nápady z Boardu a večer shrnutí dne.'], en: ['This tile has more sides.', 'Swipe up: your week, Together, ideas from Board and an evening summary.'] },
  { id: 'jedenden', cs: ['Jeden den nic nezničí.', 'Vynechat jednou je v pohodě. Jde o to nevynechat dvakrát za sebou.'], en: ['One day changes nothing.', 'Missing once is fine. The trick is never missing twice in a row.'], when: () => brokeStreak() },
  { id: 'navrat', cs: ['Návrat je taky výhra.', 'Po pauze nezačínáš od nuly. Série se počítá znovu, zkušenost zůstává.'], en: ['Coming back is a win.', 'After a break you are not at zero. The streak restarts, the experience stays.'], when: () => brokeStreak(4) },
  { id: 'rano', cs: ['Nejdřív to těžké.', 'Co nejvíc odkládáš, dej na začátek dne. Zbytek pak jde sám.'], en: ['Hard thing first.', 'Put what you avoid most at the start of the day. The rest gets easier.'] },
  { id: 'hotovo', cs: ['Hotovo je lepší než dokonalé.', 'Udělej první verzi. Vylepšit ji můžeš zítra.'], en: ['Done beats perfect.', 'Make the first version. You can improve it tomorrow.'] }
];
/* a habit that was going and then stopped: last done 2+ days ago */
function brokeStreak(min = 2) {
  return S.cards.some(c => { if (c.type !== 'habit') return false; const la = lastActive(c.id); if (!la) return false; const n = daysBetween(la, T()); return n >= min && n <= min + 3; });
}
function tipText(tp) { const L = lang() === 'cs' ? tp.cs : tp.en; return { id: tp.id, h: L[0], b: L[1], act: tp.act, btn: tp.btn ? tp.btn[lang() === 'cs' ? 0 : 1] : null }; }
/* today's tip: the same all day, a new one tomorrow (or after ×) */
function tipToday() {
  if (S.tipsOff) return null;
  S.tipLog = S.tipLog || { seen: [], day: '', id: '' };
  const L = S.tipLog, d = T();
  if (L.day === d && L.id) { const tp = TIPS.find(x => x.id === L.id); if (tp && !(tp.used && tp.used())) return tipText(tp); if (L.id === 'none') return null; }
  const ok = tp => !L.seen.includes(tp.id) && !(tp.used && tp.used()) && (!tp.when || tp.when());
  let tp = TIPS.find(x => x.when && ok(x)) || TIPS.find(ok);
  if (!tp && L.seen.length) { L.seen = []; tp = TIPS.find(x => !(x.used && x.used()) && !x.when); }
  L.day = d; L.id = tp ? tp.id : 'none'; if (tp) L.seen.push(tp.id); save();
  return tp ? tipText(tp) : null;
}
ACT.tipNext = () => { S.tipLog = S.tipLog || { seen: [] }; S.tipLog.day = ''; save(); render(); };
ACT.tipAct = el => {
  const k = el.dataset.k;
  if (k === 'add') return ACT.add(null);
  if (k === 'note') return openAdd({ mode: 'note' });
  if (k === 'photo') return openAdd({ mode: 'photo', pickPhoto: true });
  if (k === 'spaces') return go('spaces');
  if (k === 'plan') { V.planMode = 'week'; V.planWeek = weekStart(T()); V.planDay = T(); return go('plan'); }
  if (k === 'newCard') return ACT.newCard && ACT.newCard();
  if (k === 'tutorial') return ACT.tutorial && ACT.tutorial();
  if (k === 'feedback') return ACT.feedback && ACT.feedback();
  if (k === 'install') return ACT.installInfo && ACT.installInfo();
  return ACT.openSettings && ACT.openSettings();
};
ACT.tipsToggle = () => { S.tipsOff = !S.tipsOff; save(); renderSettingsIf && renderSettingsIf(); render(); };
