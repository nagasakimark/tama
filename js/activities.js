// ============================================================
//  Tama Talk – activities
//  Some wishes are activities instead of "give me ~": mini-games,
//  friend visits, letters, the garden, toys, jobs and holidays.
//  They REPLACE wishes (never extra), and each kind can only
//  happen once or twice a day, so there is variety, not more to do.
// ============================================================

const WORLD_KEY = 'tamatalk.world.v1';
let world = Object.assign({
  garden: [null, null, null], toys: [], friends: {}, letters: [], counters: {}, badges: [],
  today: { day: '', n: {} }, events: {}, visitDays: [], streak: 0,
}, load(WORLD_KEY, {}));
function saveWorld() { store(WORLD_KEY, world); }
function dayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function todayN(type) { if (world.today.day !== dayKey()) world.today = { day: dayKey(), n: {} }; return world.today.n[type] || 0; }
function markToday(type) { todayN(type); world.today.n[type] = (world.today.n[type] || 0) + 1; saveWorld(); }
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const pickN = (a, n) => shuffle(a).slice(0, n);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------- badges
const BADGES = [
  { id: 'wish1', e: '🌟', en: 'First wish', need: c => c.wishes >= 1 },
  { id: 'wish50', e: '💫', en: '50 wishes', need: c => c.wishes >= 50 },
  { id: 'wish200', e: '🌠', en: '200 wishes', need: c => c.wishes >= 200 },
  { id: 'streak5', e: '🎯', en: '5 right in a row', need: c => c.bestStreak >= 5 },
  { id: 'streak20', e: '🏹', en: '20 right in a row', need: c => c.bestStreak >= 20 },
  { id: 'days3', e: '📅', en: 'Visited on 3 days', need: c => c.days >= 3 },
  { id: 'days10', e: '🗓️', en: 'Visited on 10 days', need: c => c.days >= 10 },
  { id: 'games5', e: '🎮', en: 'Won 5 games', need: c => c.gamesWon >= 5 },
  { id: 'friends3', e: '🤝', en: 'Made 3 friends', need: c => c.friends >= 3 },
  { id: 'bff', e: '💞', en: 'Best friends', need: c => c.bff >= 1 },
  { id: 'letters5', e: '💌', en: 'Read 5 letters', need: c => c.letters >= 5 },
  { id: 'harvest3', e: '🧺', en: 'Picked 3 vegetables', need: c => c.harvests >= 3 },
  { id: 'toys5', e: '🧸', en: 'Got 5 toys', need: c => c.toys >= 5 },
  { id: 'jobs5', e: '💼', en: 'Worked 5 times', need: c => c.jobs >= 5 },
  { id: 'holiday', e: '🎉', en: 'Holiday fun', need: c => c.events >= 1 },
  { id: 'shop5', e: '🛍️', en: 'Bought 5 things', need: c => c.bought >= 5 },
  { id: 'grown1', e: '👼', en: 'Long happy life', need: c => c.pets >= 1 },
  { id: 'gen3', e: '🌳', en: '3 generations', need: c => c.gen >= 3 },
];
function count(key, n = 1) { world.counters[key] = (world.counters[key] || 0) + n; checkBadges(); saveWorld(); }
function setCount(key, v) { world.counters[key] = Math.max(world.counters[key] || 0, v); checkBadges(); saveWorld(); }
function checkBadges() {
  const c = new Proxy(world.counters, { get: (o, k) => o[k] || 0 });
  for (const b of BADGES) if (!world.badges.includes(b.id) && b.need(c)) { world.badges.push(b.id); toast(`${b.e} New badge: ${b.en}!`); }
}
function toast(text) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
  $('fxApp').appendChild(el); sfx('cheer_success.ogg', .4);
  setTimeout(() => el.remove(), 3200);
}
function noteVisit() {
  const d = dayKey();
  if (!world.visitDays.includes(d)) { world.visitDays.push(d); if (world.visitDays.length > 60) world.visitDays.shift(); count('days'); }
}
function noteWish(firstTry) {
  count('wishes');
  world.streak = firstTry ? (world.streak || 0) + 1 : 0;
  setCount('bestStreak', world.streak);
}

// ---------------------------------------------------------------- diary
function pastLine(it) {
  if (!it) return null;
  switch (it.cat) {
    case 'food': return `I ate ${it.a}.`;
    case 'drink': return `I drank ${it.a}.`;
    case 'play': return `I played ${it.en}.`;
    case 'fun': return it.done;
    case 'study': return `I studied ${it.en}.`;
    case 'go': case 'trip': return `I went to ${it.en}.`;
    case 'wear': return `I wore ${it.a}.`;
    case 'clean': return { bath: 'I took a bath.', shower: 'I took a shower.', teeth: 'I brushed my teeth.', hands: 'I washed my hands.', cleanup: 'I cleaned my room.' }[it.id];
    case 'sleep': return 'I slept.';
    case 'hug': return 'I got a big hug.';
  }
  return null;
}
function addDiary(line) {
  if (!pet || !line) return;
  pet.diary = pet.diary || [];
  const d = dayKey();
  let day = pet.diary.find(x => x.d === d);
  if (!day) { day = { d, lines: [] }; pet.diary.push(day); if (pet.diary.length > 30) pet.diary.shift(); }
  if (!day.lines.includes(line) && day.lines.length < 8) day.lines.push(line);
}

// ---------------------------------------------------------------- holidays
// [month, firstDay, lastDay]
const EVENTS = [
  { id: 'newyear', from: [1, 1], to: [1, 7], hi: 'Happy New Year!', decor: '🎍', gift: { stars: 10, line: 'Here is a New Year present!' },
    wishes: [{ en: "Happy New Year! Let's go to the shrine!", ok: ['shrine'] }, { en: "It's cold. I want hot chocolate.", ok: ['cocoa'] }] },
  { id: 'setsubun', from: [2, 1], to: [2, 3], hi: 'Devils out! Luck in!', decor: '👹', gift: { stars: 5, line: 'Throw the beans! Here are some stars!' },
    wishes: [{ en: 'I want a rice ball!', ok: ['riceball'] }] },
  { id: 'valentine', from: [2, 10], to: [2, 14], hi: "Happy Valentine's Day!", decor: '💝', art: [['furn/gift_valentine', 62, 64], ['furn/bear_valentine', 78, 70]], gift: { stars: 5, line: 'This chocolate is for you!' },
    wishes: [{ en: "It's Valentine's Day! I want chocolate!", ok: ['chocolate'] }] },
  { id: 'hina', from: [3, 1], to: [3, 3], hi: "Happy Girls' Day!", decor: '🎎', gift: { stars: 5, line: 'Here are some stars for you!' }, wishes: [] },
  { id: 'children', from: [5, 1], to: [5, 5], hi: "Happy Children's Day!", decor: '🎏', gift: { stars: 5, line: 'Here are some stars for you!' },
    wishes: [{ en: "It's Children's Day! Let's play soccer!", ok: ['soccer'] }] },
  { id: 'tanabata', from: [7, 1], to: [7, 7], hi: "It's Tanabata! Let's make a wish!", decor: '🎋', gift: { stars: 5, line: 'I wrote my wish on paper!' },
    wishes: [{ en: 'My Tanabata wish: I want to be a singer!', ok: ['sing'] }] },
  { id: 'summer', from: [8, 1], to: [8, 20], hi: "It's summer vacation!", decor: '🍉', gift: { stars: 5, line: 'Here is a summer present!' },
    wishes: [{ en: "It's hot! Let's go to the sea!", ok: ['sea', 'swim'] }, { en: "It's hot! I want shaved ice!", ok: ['shavedice'] }] },
  { id: 'halloween', from: [10, 20], to: [10, 31], hi: 'Trick or treat!', reply: 'Happy Halloween!', decor: '🎃', art: [['furn/big_pumpkin', 60, 62], ['furn/small_pumpkin', 82, 74]], gift: { acc: 'pumpkin_01', line: 'Here is a pumpkin for you!' },
    wishes: [{ en: 'Trick or treat! I want chocolate!', ok: ['chocolate'] }, { en: 'Trick or treat! I want cookies!', ok: ['cookie'] }] },
  { id: 'christmas', from: [12, 1], to: [12, 25], hi: 'Merry Christmas!', decor: '🎄', art: [['misc/xmas_tree_01', 60, 12]], gift: { acc: 'santa_hat_01', line: 'Here is a Santa hat for you!' },
    wishes: [{ en: "It's Christmas! I want cake!", ok: ['cake'] }, { en: "It's Christmas! I want fried chicken!", ok: ['chicken'] }, { en: "It's snowy. I want a scarf.", ok: ['scarf'] }] },
];
function eventToday(d = window.__testDate || new Date()) {
  const m = d.getMonth() + 1, day = d.getDate();
  return EVENTS.find(e => (m > e.from[0] || (m === e.from[0] && day >= e.from[1])) && (m < e.to[0] || (m === e.to[0] && day <= e.to[1])));
}
function eventNeed() {
  const ev = eventToday();
  if (!ev || !ev.wishes.length || Math.random() > 0.3) return null;
  const w = rnd(ev.wishes);
  const ok = w.ok.filter(id => unlocked(pet.stage, ITEM[id].cat));
  if (!ok.length) return null;
  return { key: 'ev:' + w.en, en: w.en, ja: '', ok, tries: 0 };
}

// ================================================================ ORIGINAL ARTWORK HELPERS
// Tamaweb sprite sheets: foods 24px (33 cols), items/toys 22px (10 cols), plants 24px (28 cols)
const SHEETS = { food: ['assets/item/foods.png', 24, 33], item: ['assets/item/items.png', 22, 10], plant: ['assets/item/plants.png', 24, 28] };
const FOOD_SPR = { bread: 542, pizza: 515, hamburger: 2, sushi: 605, spaghetti: 219, ramen: 590, chicken: 460, salad: 323, riceball: 800,
  icecream: 1024, cake: 998, donut: 954, juice: 905, milk: 1036, banana: 960, curry: 536, takoyaki: 1068, pancakes: 806 };
const TOYS = [
  { id: 'bear', spr: 10, en: 'teddy bear' }, { id: 'ball', spr: 4, en: 'ball' }, { id: 'robot', spr: 15, en: 'robot' },
  { id: 'skate', spr: 11, en: 'skateboard' }, { id: 'game', spr: 14, en: 'video game' }, { id: 'cube', spr: 12, en: 'cube' },
  { id: 'music', spr: 3, en: 'radio' }, { id: 'fox', spr: 1, en: 'toy fox' },
];
const CROPS = [ // first plant cell; +1 growing, +2 ready
  { id: 'tomato', one: 'tomato', spr: 33, pl: 'tomatoes' }, { id: 'carrot', one: 'carrot', spr: 41, pl: 'carrots' }, { id: 'potato', one: 'potato', spr: 45, pl: 'potatoes' },
  { id: 'sweetpotato', one: 'sweet potato', spr: 49, pl: 'sweet potatoes' }, { id: 'watermelon', one: 'watermelon', spr: 53, pl: 'watermelons' }, { id: 'peach', one: 'peach', spr: 57, pl: 'peaches' },
  { id: 'cabbage', one: 'cabbage', spr: 29, pl: 'cabbages' },
];
function drawSheet(c, sheet, n, x, y, size) {
  const [src, cs, cols] = SHEETS[sheet], im = img(src);
  if (!im.complete || !im.naturalWidth) return;
  const i = n - 1; size = size || cs;
  c.drawImage(im, (i % cols) * cs, Math.floor(i / cols) * cs, cs, cs, Math.round(x), Math.round(y), size, size);
}
function drawPic(c, name, x, y) { const im = img(`assets/${name}.png`); if (im.complete && im.naturalWidth) c.drawImage(im, Math.round(x), Math.round(y)); }
function picSize(name) { const im = img(`assets/${name}.png`); return [im.naturalWidth || 0, im.naturalHeight || 0]; }
// a sprite as a button icon
function icon(sheet, n, px = 64) {
  const cv = document.createElement('canvas'), cs = SHEETS[sheet][1]; cv.width = cv.height = cs; cv.className = 'pix'; cv.style.width = cv.style.height = px + 'px';
  const go = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; drawSheet(c, sheet, n, 0, 0); };
  const im = img(SHEETS[sheet][0]); if (im.complete) go(); else im.addEventListener('load', go);
  return cv;
}
function picIcon(name, px = 72) {
  const i = new Image(); i.src = `assets/${name}.png`; i.className = 'pix'; i.style.height = px + 'px'; return i;
}
// draw any character (friends, customers) standing on the floor
function drawChar(c, id, x, feet, cellNo = 1, flip = false) {
  const im = img(charSrc(id)); if (!im.complete || !im.naturalWidth) return;
  const cs = im.naturalWidth / 4; drawCell(c, im, cellNo, cs, Math.round(x - cs / 2), Math.round(feet - cs), flip);
}
// draw our pet (with its accessory) – uses view.x / view.jump so hearts and stars appear in the right place
function drawMe(c, t, cellNo, flip = false) {
  const r = petRect(), acc = ACCS.find(a => a.id === shop.wearing);
  const sh = img('assets/misc/shadow_01.png');
  if (sh.complete && !view.jump) { c.globalAlpha = .35; c.drawImage(sh, r.x + r.w * .05, FEET - r.w * .22, r.w * .9, r.w * .45); c.globalAlpha = 1; }
  if (acc && !acc.front) drawAcc(c, acc.id, cellNo, r, flip, pet.sprite);
  drawCell(c, img(charSrc(pet.sprite)), cellNo, r.w, r.x, r.y, flip);
  if (acc && acc.front) drawAcc(c, acc.id, cellNo, r, flip, pet.sprite);
}
function animCell(name, t) { const a = ANIM[name] || ANIM.idle; return a.f[Math.floor(t / a.t) % a.f.length]; }
// standard pet behaviour inside a scene: walks to view.tx, plays view.anim
function meCell(t) {
  if (view.anim && t < view.animUntil) return animCell(view.anim, t);
  if (Math.abs(view.tx - view.x) > 0.4) return animCell('walk', t);
  return animCell('idle', t);
}
function stepMe() {
  if (Math.abs(view.tx - view.x) > 0.3) { view.flip = view.tx > view.x; view.x += Math.sign(view.tx - view.x) * Math.min(0.5, Math.abs(view.tx - view.x)); }
}

// ---------------------------------------------------------------- room decorations (original art drawn in the room)
function decorHtml() { const ev = eventToday(); return ev && !ev.art ? `<span class="decor ev">${ev.decor}</span>` : ''; }
function drawDecor(c) {
  const ev = eventToday();
  if (ev && ev.art) ev.art.forEach(([n, x, y]) => drawPic(c, n, x, y));
  world.toys.slice(-3).forEach((id, i) => { const t = TOYS.find(x => x.id === id); if (t) drawSheet(c, 'item', t.spr, 2 + i * 13, FEET - 12, 14); });
}

// ---------------------------------------------------------------- the activity frame: screen + bubble (left) + answers (right)
window.actScene = null;
function scene(bg, def) {
  setBg(bg); $('emojiLayer').innerHTML = ''; place = bg;
  window.actScene = def; $('app').classList.add('inact');
}
function endScene() { window.actScene = null; $('app').classList.remove('inact'); panelClose(); $('bubbleWho').classList.add('hidden'); hideBubble(); }
function talk(text, who = '', html = null) {
  showBubble(text, { reply: false });
  if (html) $('bubbleText').innerHTML = html;
  $('bubbleBtns').classList.add('hidden');
  $('bubbleWho').textContent = who; $('bubbleWho').classList.toggle('hidden', !who);
}
function panel(title, html = '') {
  $('tray').classList.add('hidden'); $('profile').classList.add('hidden');
  $('actPanel').classList.remove('hidden');
  $('apHead').innerHTML = title; $('apBody').innerHTML = html;
  return $('apBody');
}
function panelClose() { $('actPanel').classList.add('hidden'); $('profile').classList.remove('hidden'); }
const wait = el => new Promise(r => el.addEventListener('click', r, { once: true }));
function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
// answer buttons in the right panel. opts: [{label, icon (element), ...}] → number of wrong tries
function choose(title, opts, isRight, { cols = 2, onWrong, onRight } = {}) {
  const box = panel(title);
  const grid = h(`<div class="agrid" style="grid-template-columns:repeat(${cols},1fr)"></div>`); box.appendChild(grid);
  let wrongs = 0;
  return new Promise(res => opts.forEach(o => {
    const b = h(`<button class="abtn${o.icon ? '' : ' txt'}"></button>`);
    if (o.icon) b.appendChild(o.icon);
    if (o.label) b.appendChild(h(`<span class="al">${o.label}</span>`));
    b.onclick = async () => {
      if (b.disabled) return;
      if (isRight(o)) { b.classList.add('right'); grid.querySelectorAll('button').forEach(x => x.disabled = true); sfx('task_complete.ogg', .4); onRight && onRight(o); await sleep(600); res(wrongs); }
      else { wrongs++; b.classList.add('wrong'); b.disabled = true; sfx('refuse.ogg', .4); setAnim('refuse', 900); onWrong && onWrong(o); }
    };
    grid.appendChild(b);
  }));
}
async function okButton(label = 'OK') { const b = h(`<button class="big">${label}</button>`); $('apBody').appendChild(b); await wait(b); }

// ================================================================ MINI-GAMES (like the original's: they happen in the screen)
const CATCH_TARGETS = [['banana', 'bananas'], ['hamburger', 'hamburgers'], ['riceball', 'rice balls'], ['donut', 'donuts']];
async function gameCatch() {
  const [tid, tpl] = rnd(CATCH_TARGETS), GOAL = 6;
  const others = Object.keys(FOOD_SPR).filter(k => k !== tid);
  let caught = 0, items = [], last = 0, t0 = performance.now(), mx = 48, done = false;
  view.x = view.tx = 48;
  talk(`Catch ${GOAL} ${tpl}!`);
  const box = panel('🎮 Catch game');
  box.appendChild(icon('food', FOOD_SPR[tid], 72)); box.appendChild(h(`<div class="aword">${tpl}</div>`));
  const score = h(`<div class="ascore">0 / ${GOAL}</div>`), timer = h(`<div class="atime">⏱ 30</div>`), help = h(`<div class="ahelp">👆 Move your pet on the screen</div>`);
  box.append(score, timer, help);
  return new Promise(res => {
    scene('park2', {
      move: x => { mx = x; },
      draw(c, t) {
        const left = Math.max(0, 30 - (t - t0) / 1000);
        timer.textContent = '⏱ ' + Math.ceil(left);
        if (!done && t - last > 800) { last = t; items.push({ id: Math.random() < .45 ? tid : rnd(others), x: 8 + Math.random() * 80, y: -16, v: .35 + Math.random() * .25 }); }
        view.tx = Math.max(10, Math.min(86, mx));
        stepMe();
        const r = petRect();
        for (const o of items) {
          o.y += o.v; drawSheet(c, 'food', FOOD_SPR[o.id], o.x - 8, o.y, 16);
          if (!o.gone && o.y + 14 > r.y + 4 && o.y < FEET - 4 && Math.abs(o.x - view.x) < r.w / 2 + 4) {
            o.gone = true;
            if (o.id === tid) { caught++; score.textContent = `${caught} / ${GOAL}`; sfx('eat.ogg', .4); setAnim('eat', 400); burst('heart', 1); }
            else { sfx('refuse.ogg', .3); setAnim('refuse', 600); talk(`No! That's not ${ITEM[tid].a}!`); setTimeout(() => !done && talk(`Catch ${GOAL} ${tpl}!`), 1200); }
          }
          if (o.y > 96) o.gone = true;
        }
        items = items.filter(o => !o.gone);
        drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip);
        if (!done && (caught >= GOAL || left <= 0)) { done = true; res(gameEnd(caught >= GOAL, `I caught ${caught} ${caught === 1 ? ITEM[tid].en : tpl}!`, 'I played a catch game.')); }
      },
    });
  });
}

async function gameNumber() {
  const max = pet.stage >= 3 ? 30 : 10, n = 1 + Math.floor(Math.random() * max), maxTries = max === 30 ? 5 : 4;
  view.x = view.tx = 48;
  scene('arcade2', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t)); } });
  talk(`I'm thinking of a number from 1 to ${max}. What is it?`);
  const box = panel(`🎮 Guess my number`);
  const grid = h(`<div class="agrid nums" style="grid-template-columns:repeat(${max === 30 ? 6 : 5},1fr)"></div>`), tries = h(`<div class="ascore">Tries: 0 / ${maxTries}</div>`);
  box.append(grid, tries);
  let k = 0;
  return new Promise(res => {
    for (let i = 1; i <= max; i++) {
      const b = h(`<button class="abtn txt num">${i}</button>`);
      b.onclick = async () => {
        k++; tries.textContent = `Tries: ${k} / ${maxTries}`;
        if (i === n) { b.classList.add('right'); talk(`Yes! It's ${n}!`); setAnim('cheer', 1500); sfx('cheer.ogg', .5); grid.querySelectorAll('button').forEach(x => x.disabled = true); await sleep(1500); return res(gameEnd(true, `You got it in ${k} ${k === 1 ? 'try' : 'tries'}!`, 'I played a number game.')); }
        sfx('pop_01.mp3', .4); setAnim('refuse', 700);
        talk(i < n ? `No. It's bigger than ${i}.` : `No. It's smaller than ${i}.`);
        grid.querySelectorAll('button').forEach(x => { const v = +x.textContent; if ((i < n && v <= i) || (i > n && v >= i)) { x.disabled = true; x.classList.add('out'); } });
        if (k >= maxTries) { grid.querySelectorAll('button').forEach(x => x.disabled = true); talk(`It was ${n}!`); await sleep(1600); res(gameEnd(false, `It was ${n}. Let's play again next time!`, 'I played a number game.')); }
      };
      grid.appendChild(b);
    }
  });
}

const MOVES = [
  { id: 'jump', en: 'Jump!' }, { id: 'left', en: 'Go left!' }, { id: 'right', en: 'Go right!' }, { id: 'sit', en: 'Sit down!' },
  { id: 'turn', en: 'Turn around!' }, { id: 'clap', en: 'Clap your hands!' }, { id: 'dance', en: 'Dance!' }, { id: 'sleep', en: 'Go to sleep!' },
];
async function doMove(m) {
  view.x = view.tx = 48;
  if (m.id === 'jump') { sfx('jump.ogg', .4); await hop(1, 8); }
  else if (m.id === 'left') { view.tx = 26; await sleep(900); view.tx = 48; await sleep(500); }
  else if (m.id === 'right') { view.tx = 70; await sleep(900); view.tx = 48; await sleep(500); }
  else if (m.id === 'sit') { setAnim('sit', 1300); await sleep(1300); }
  else if (m.id === 'turn') { setAnim('side', 1300); for (let i = 0; i < 4; i++) { view.flip = !view.flip; await sleep(300); } }
  else if (m.id === 'clap') { setAnim('cheer', 1300); await sleep(1300); }
  else if (m.id === 'dance') { setAnim('cheer', 1300); for (let i = 0; i < 4; i++) { view.flip = !view.flip; await hop(1, 3); } }
  else if (m.id === 'sleep') { setAnim('sleep', 1300); burst('z', 2); await sleep(1300); }
  view.tx = view.x = 48;
}
async function gameSimon() {
  const lens = pet.stage >= 3 ? [2, 3, 4] : [2, 3];
  view.x = view.tx = 48; let showing = null;
  scene('gym', { draw(c, t) { stepMe(); const sideways = view.anim === 'side' && t < view.animUntil; drawMe(c, t, meCell(t), (Math.abs(view.tx - view.x) > .4 || sideways) && view.flip); } });
  let wins = 0;
  for (let r = 0; r < lens.length; r++) {
    const seq = Array.from({ length: lens[r] }, () => rnd(MOVES));
    for (let attempt = 0; attempt < 2; attempt++) {
      panel(`🎮 Copy me! &nbsp;Round ${r + 1}/${lens.length}`, '<div class="ahelp">👀 Watch your pet…</div>');
      talk('Watch me!'); await sleep(1000);
      for (const m of seq) { talk(m.en); await doMove(m); await sleep(200); }
      talk('Your turn! What did I do?');
      const ok = await new Promise(res => {
        let i = 0; const box = panel(`🎮 Copy me! &nbsp;Round ${r + 1}/${lens.length}`, `<div class="ahelp">Tap them in order (${seq.length})</div>`);
        const grid = h('<div class="agrid" style="grid-template-columns:repeat(2,1fr)"></div>'); box.appendChild(grid);
        MOVES.forEach(m => { const b = h(`<button class="abtn txt">${m.en}</button>`); b.onclick = () => { if (m.id === seq[i].id) { i++; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 300); sfx('pop_01.mp3', .3); if (i === seq.length) res(true); } else res(false); }; grid.appendChild(b); });
      });
      if (ok) { wins++; talk('Great!'); setAnim('cheer', 900); sfx('cheer.ogg', .4); await sleep(1000); break; }
      talk(attempt === 0 ? 'Oops! Watch again!' : 'Oops! Next one!'); setAnim('refuse', 900); sfx('refuse.ogg', .3); await sleep(1200);
    }
  }
  return gameEnd(wins === lens.length, `You copied ${wins} of ${lens.length}!`, 'I played Copy Me.');
}

const SPELL = [['food', 'bread', 'BREAD'], ['food', 'pizza', 'PIZZA'], ['food', 'sushi', 'SUSHI'], ['food', 'salad', 'SALAD'], ['food', 'cake', 'CAKE'],
  ['food', 'milk', 'MILK'], ['food', 'banana', 'BANANA'], ['food', 'ramen', 'RAMEN'], ['food', 'donut', 'DONUT'], ['item', 4, 'BALL'], ['item', 15, 'ROBOT'], ['item', 10, 'BEAR']];
async function gameSpell() {
  const [sheet, key, word] = rnd(SPELL), spr = sheet === 'food' ? FOOD_SPR[key] : key;
  view.x = view.tx = 34;
  scene('classroom', { draw(c, t) {
    drawMe(c, t, meCell(t));
    drawPic(c, 'misc/thought_bubble_01', 50, 30);
    const [bw, bh] = picSize('misc/thought_bubble_01');
    drawSheet(c, sheet, spr, 50 + bw / 2 - 11, 30 + bh / 2 - 13, 22);
  } });
  const extra = shuffle('ABCDEFGHIKLMNOPRSTUW'.split('').filter(l => !word.includes(l))).slice(0, 3);
  let i = 0, wrong = 0;
  const show = () => talk('', '', `What is it? Spell it!<div class="blanks">${word.split('').map((L, k) => `<b>${k < i ? L : ''}</b>`).join('')}</div>`);
  show();
  const box = panel('🎮 Spelling');
  const grid = h(`<div class="agrid" style="grid-template-columns:repeat(4,1fr)"></div>`); box.appendChild(grid);
  return new Promise(res => shuffle([...word.split(''), ...extra]).forEach(L => {
    const b = h(`<button class="abtn txt letter">${L}</button>`);
    b.onclick = async () => {
      if (L === word[i]) { i++; b.disabled = true; b.classList.add('right'); sfx('pop_01.mp3', .4); show();
        if (i === word.length) { setAnim('cheer', 1500); await sleep(1300); res(gameEnd(wrong <= 2, `${word.charAt(0) + word.slice(1).toLowerCase()}! You spelled it!`, `I spelled "${word.toLowerCase()}".`)); } }
      else { wrong++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); sfx('refuse.ogg', .3); setAnim('refuse', 700); }
    };
    grid.appendChild(b);
  }));
}

async function gameEnd(won, line, diary) {
  talk(won ? `You win! ${line}` : `Good try! ${line}`);
  setAnim(won ? 'cheer' : 'idle', 2000);
  sfx(won ? 'cheer_success.ogg' : 'task_complete.ogg', .5);
  if (won) { confetti(); count('gamesWon'); }
  panel(won ? '🏆 You win!' : '👍 Good try!', `<div class="aword">${line}</div>`);
  await okButton();
  return { good: won, stars: won ? 4 : 2, diary };
}

// ================================================================ FRIENDS (another pet visits)
const FRIEND_NAMES = ['Momo', 'Ken', 'Yui', 'Sora', 'Hana', 'Riku', 'Emma', 'Leo', 'Lily', 'Max', 'Mia', 'Taro'];
function friendQuestions() {
  const bd = pet.born ? new Date(pet.born) : new Date();
  const myBd = `My birthday is ${MONTHS[bd.getMonth()]} ${bd.getDate()}.`;
  const otherBd = `My birthday is ${MONTHS[(bd.getMonth() + 5) % 12]} ${((bd.getDate() + 9) % 28) + 1}.`;
  const sport = rnd(byCat('play').filter(i => i.sport)), food = rnd(byCat('food')), place = rnd(byCat('go'));
  const subj = rnd(byCat('study')), canDo = rnd(['swim', 'cook', 'ride a bike', 'skate', 'play the piano']);
  const Q = [
    { q: `Do you like ${sport.en}?`, a: ['Yes, I do.', "No, I don't."], x: ['Yes, I can.', "I'm fine."] },
    { q: `Can you ${canDo}?`, a: ['Yes, I can.', "No, I can't."], x: ['Yes, I do.', "It's sunny."] },
    { q: 'When is your birthday?', a: [myBd], x: [otherBd, `I'm ${age()} years old.`] },
    { q: 'How old are you?', a: [`I'm ${age()} years old.`], x: [myBd, "I'm happy."] },
    { q: 'What do you want to eat?', a: [`I want ${food.a}.`], x: [`I like ${sport.en}.`, `I went to ${place.en}.`] },
    { q: 'What sport do you like?', a: [`I like ${sport.en}.`], x: [`I want ${food.a}.`, 'Yes, I do.'] },
  ];
  if (pet.stage >= 3) Q.push(
    { q: 'Where do you want to go?', a: [`I want to go to ${place.en}.`], x: [`I want ${food.a}.`, `I'm ${age()} years old.`] },
    { q: "What's your favorite subject?", a: [`My favorite subject is ${subj.en}.`], x: [`I want to go to ${place.en}.`, "No, I don't."] },
    { q: 'What did you do yesterday?', a: [`I went to ${place.en}.`, `I played ${sport.en}.`], x: [`I want to go to ${place.en}.`, `I like ${sport.en}.`] },
  );
  if (pet.stage >= 4) Q.push({ q: 'What do you want to be?', a: [`I want to be ${rnd(DREAMS).en}.`], x: [`I want ${food.a}.`, `I went to ${place.en}.`] });
  return pickN(Q, 3);
}
async function visitFriend() {
  const known = Object.keys(world.friends);
  const name = known.length && (known.length >= 4 || Math.random() < 0.6) ? rnd(known) : rnd(FRIEND_NAMES.filter(n => !known.includes(n)));
  const isNew = !world.friends[name];
  const f = world.friends[name] = world.friends[name] || { sprite: rnd([...CHARS.teen, ...CHARS.adult]), hearts: 0 };
  let fx = 110, fAnim = 'walk', fUntil = 0;
  view.x = view.tx = 30;
  scene(shop.room || 'home_03', { draw(c, t) {
    if (fx > 66) fx -= .5;
    const fc = fx > 66 ? animCell('walk', t) : t < fUntil ? animCell(fAnim, t) : animCell('idle', t);
    stepMe(); drawMe(c, t, meCell(t));
    drawChar(c, f.sprite, fx, FEET, fc, false);
  } });
  const fsay = (txt, anim) => { talk(txt, name); if (anim) { fAnim = anim; fUntil = performance.now() + 1200; } };
  const opt = arr => arr.map(t => ({ label: t, t }));
  let wrong = 0;
  sfx('cute.ogg', .4); await sleep(1000);
  if (isNew) {
    fsay(`Hi! I'm ${name}. What's your name?`, 'cheer');
    wrong += await choose('💬 Answer', shuffle(opt([`I'm ${pet.name}.`, "I'm fine.", "I'm hungry."])), o => o.t === `I'm ${pet.name}.`, { cols: 1 });
    fsay(`Nice to meet you, ${pet.name}!`, 'cheer');
    wrong += await choose('💬 Answer', shuffle(opt(['Nice to meet you, too!', 'Good night!', 'See you!'])), o => o.t === 'Nice to meet you, too!', { cols: 1 });
  } else {
    fsay(`Hi, ${pet.name}! How are you?`, 'cheer');
    wrong += await choose('💬 Answer', shuffle(opt(["I'm good!", `I'm ${age()} years old.`, "It's Monday."])), o => o.t === "I'm good!", { cols: 1 });
  }
  for (const q of friendQuestions()) {
    fsay(q.q);
    const right = rnd(q.a);
    wrong += await choose('💬 Answer', shuffle(opt([right, ...q.x])), o => o.t === right, { cols: 1, onRight: () => setAnim('cheer', 900) });
    fsay(rnd(['Me too!', 'Cool!', 'Nice!', 'Really? Wow!']), 'cheer'); burst('heart', 2);
    await sleep(1000);
  }
  f.hearts = Math.min(5, f.hearts + 1);
  let giftLine = '';
  if (f.hearts === 5 && !f.bff) {
    f.bff = true; count('bff');
    const acc = ACCS.find(a => !shop.acc.includes(a.id) && a.price <= 60);
    if (acc) { shop.acc.push(acc.id); store(SHOP_KEY, shop); giftLine = `We're best friends! This ${acc.en.toLowerCase()} is for you!`; }
  }
  fsay(giftLine || 'This is for you!', 'cheer');
  wrong += await choose('💬 Answer', shuffle(opt(['Thank you!', "You're welcome.", 'Good morning!'])), o => o.t === 'Thank you!', { cols: 1 });
  fsay('Bye! See you!');
  wrong += await choose('💬 Answer', shuffle(opt(['See you!', 'Nice to meet you.', 'Happy birthday!'])), o => o.t === 'See you!', { cols: 1 });
  panel(`💗 ${name}`, `<div class="hearts">${'💗'.repeat(f.hearts)}${'🤍'.repeat(5 - f.hearts)}</div>`);
  burst('heart', 5); await sleep(1600);
  world.friends[name] = f; setCount('friends', Object.keys(world.friends).length);
  return { good: wrong === 0, stars: 3, diary: `My friend ${name} came to my house.` };
}

// ================================================================ LETTERS
const TOWN = [ // original building art
  { id: 'park', en: 'the park', clue: 'the place with slides and swings' }, { id: 'school', en: 'school', clue: 'the place with teachers and students' },
  { id: 'market', en: 'the market', clue: 'the place with fruit and vegetables' }, { id: 'hospital', en: 'the hospital', clue: 'the place with doctors and nurses' },
  { id: 'restaurant', en: 'the restaurant', clue: 'the place with cooks and waiters' }, { id: 'arcade', en: 'the arcade', clue: 'the place with video games' },
  { id: 'mall', en: 'the mall', clue: 'the place with many shops' },
];
async function readLetter() {
  const known = Object.keys(world.friends), from = known.length ? rnd(known) : rnd(FRIEND_NAMES);
  const place = rnd(TOWN.filter(p => p.id !== 'hospital')), foodId = rnd(Object.keys(FOOD_SPR).filter(k => ITEM[k])), food = ITEM[foodId];
  const text = `I went to ${place.en} with my family. I ate ${food.a}. It was ${rnd(['delicious', 'fun', 'great'])}!`;
  view.x = view.tx = 48;
  scene(shop.room || 'home_03', { draw(c, t) { drawMe(c, t, meCell(t)); drawPic(c, 'misc/gift', view.x + 8, FEET - 30); } });
  setAnim('cheer', 1200); sfx('pop_01.mp3', .5);
  showBubble('', {}); $('bubbleBtns').classList.add('hidden');
  $('bubbleWho').textContent = '💌 A letter'; $('bubbleWho').classList.remove('hidden');
  $('bubbleText').innerHTML = `<div class="letterTxt"><span class="dear">Dear ${pet.name},</span><br>${text}<br><span class="from">From, ${from}</span></div>`;
  let wrong;
  if (Math.random() < .5) wrong = await choose(`❓ Where did ${from} go?`, shuffle([place, ...pickN(TOWN.filter(p => p.id !== place.id), 2)]).map(p => ({ label: p.en, icon: picIcon('misc/building_' + p.id, 76), id: p.id })), o => o.id === place.id, { cols: 3 });
  else wrong = await choose(`❓ What did ${from} eat?`, shuffle([foodId, ...pickN(Object.keys(FOOD_SPR).filter(k => k !== foodId && ITEM[k]), 2)]).map(k => ({ label: ITEM[k].en, icon: icon('food', FOOD_SPR[k], 64), id: k })), o => o.id === foodId, { cols: 3 });
  world.letters.unshift({ d: dayKey(), from, text }); if (world.letters.length > 40) world.letters.pop();
  count('letters'); setAnim('cheer', 1000); await sleep(700);
  return { good: wrong === 0, stars: 2, diary: `I got a letter from ${from}.` };
}

// ================================================================ GARDEN (original garden art; grows over real days, never dies)
const PATCH_X = [36, 60, 84], PATCH_Y = 58;
function gardenMode() {
  const g = world.garden, d = dayKey();
  if (g.some(p => p && p.stage >= 2)) return 'harvest';
  if (g.some(p => p && p.stage < 2 && p.watered !== d)) return 'water';
  if (g.some(p => !p)) return 'plant';
  return null;
}
async function garden() {
  const mode = gardenMode(), g = world.garden, d = dayKey();
  let canAt = -1, wet = -1;
  view.x = view.tx = 12;
  scene('garden', { draw(c, t) {
    stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip);
    g.forEach((p, i) => {
      drawPic(c, i === wet || (p && p.watered === d) ? 'misc/garden_patch_01_wet' : 'misc/garden_patch_01', PATCH_X[i] - 12, PATCH_Y);
      if (p) { const crop = CROPS.find(x => x.id === p.id); drawSheet(c, 'plant', crop.spr + Math.min(2, p.stage), PATCH_X[i] - 12, PATCH_Y - 14);
        drawSheet(c, 'plant', crop.spr + 2, PATCH_X[i] - 6, PATCH_Y + 23, 12); } // little picture sign
    });
    if (canAt >= 0) drawPic(c, 'misc/watering_can_01', PATCH_X[canAt] - 4, PATCH_Y - 34 + Math.sin(t / 120) * 2);
  } , tap: null });
  view.hidden = false;
  let wrong = 0, diary = '';
  if (mode === 'plant') {
    const crop = rnd(CROPS.filter(c => !g.some(p => p && p.id === c.id)));
    talk(`Let's plant ${crop.pl}!`);
    wrong = await choose('🌱 Which seeds?', shuffle([crop, ...pickN(CROPS.filter(c => c.id !== crop.id), 2)]).map(c => ({ label: `${c.pl}`, icon: icon('plant', c.spr + 2, 64), id: c.id })), o => o.id === crop.id, { cols: 3 });
    const i = g.findIndex(p => !p); g[i] = { id: crop.id, stage: 0, watered: d };
    sfx('jump.ogg', .4); talk(`We planted ${crop.pl}! Let's water them every day.`); diary = `I planted ${crop.pl}.`;
  } else {
    const targets = g.map((p, i) => [p, i]).filter(([p]) => p && (mode === 'harvest' ? p.stage >= 2 : p.stage < 2 && p.watered !== d));
    const [p, idx] = rnd(targets), crop = CROPS.find(x => x.id === p.id);
    talk(mode === 'harvest' ? `The ${crop.pl} are ready! Let's pick them!` : `Water the ${crop.pl}, please.`);
    panel('🌱 The garden', '<div class="ahelp">👆 Tap the right plant on the screen</div>');
    wrong = await new Promise(res => { let w = 0; actScene.tap = x => {
      const i = PATCH_X.findIndex(px => Math.abs(px - x) < 12);
      if (i < 0 || !g[i]) return;
      if (i === idx) { actScene.tap = null; res(w); } else { w++; sfx('refuse.ogg', .3); setAnim('refuse', 700); }
    }; });
    view.tx = PATCH_X[idx] - 16;
    if (mode === 'harvest') {
      g[idx] = null; sfx('cheer_success.ogg', .5); setAnim('cheer', 1500); burst('star', 3); count('harvests');
      talk(`Yummy ${crop.pl}!`); diary = `I picked ${crop.pl}.`;
    } else {
      canAt = idx; sfx('pop_01.mp3', .5); await sleep(1100); canAt = -1; wet = idx;
      p.stage++; p.watered = d; setAnim('cheer', 1000);
      talk(p.stage >= 2 ? `Wow! The ${crop.pl} are ready! Let's pick them next time.` : "They're growing!");
      diary = `I watered the ${crop.pl}.`;
    }
  }
  saveWorld(); panel('🌱 The garden', ''); await sleep(1800);
  return { good: wrong === 0, stars: mode === 'harvest' ? 4 : 2, diary };
}

// ================================================================ TOYS (put it on / under / by / in …) – original furniture art
const FURN = [
  { id: 'table', pic: 'misc/table_01', en: 'table', spots: [['on', 0.5, -4], ['under', 0.5, 0.75]] },
  { id: 'chair', pic: 'furn/chair_orange', en: 'chair', spots: [['on', 0.5, 0.25], ['by', 1.25, 0.6]] },
  { id: 'tv', pic: 'furn/tv_01', en: 'TV', spots: [['on', 0.5, -4], ['by', 1.25, 0.6]] },
  { id: 'bed', pic: 'furn/race_car_minibed', en: 'bed', spots: [['on', 0.5, 0.2], ['by', 1.2, 0.6]] },
];
async function toyTime() {
  const toy = TOYS.find(t => !world.toys.includes(t.id)) || rnd(TOYS);
  const F = rnd(FURN), [fw, fh] = picSize(F.pic);
  const piece = { f: F, w: fw || 32, h: fh || 30 }; piece.x = Math.round(44 - piece.w / 2); piece.y = FEET - piece.h;
  const spots = F.spots.map(([prep, fx, fy]) => ({ en: `${prep} the ${F.en}`, x: piece.x + piece.w * fx, y: fy < 0 ? piece.y + fy : piece.y + piece.h * fy }));
  if (!spots.some(s => s.en.startsWith('by'))) spots.push({ en: `by the ${F.en}`, x: piece.x - 9, y: FEET - 8 });
  else spots.forEach(s => { if (s.en.startsWith('by')) { s.x = piece.x - 9; s.y = FEET - 8; } });
  const target = rnd(spots);
  let placed = null;
  view.x = view.tx = 84;
  scene(shop.room || 'home_03', { draw(c, t) {
    drawPic(c, F.pic, piece.x, piece.y);
    if (!placed) spots.forEach(s => {
      c.globalAlpha = .55; c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, 6, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = '#ff7a1a'; c.lineWidth = 1; c.setLineDash([2, 1.5]); c.lineDashOffset = -t / 120; c.beginPath(); c.arc(s.x, s.y, 6, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    });
    drawMe(c, t, meCell(t));
    if (placed) drawSheet(c, 'item', toy.spr, placed.x - 7, placed.y - 7, 14);
    else drawSheet(c, 'item', toy.spr, view.x - 7, petRect().y - 16 + Math.sin(t / 200) * 1.5, 14);
  } });
  talk(`I got a new ${toy.en}! Put it ${target.en}, please.`);
  const box = panel('🧸 A new toy!');
  box.appendChild(icon('item', toy.spr, 80)); box.appendChild(h(`<div class="aword">${toy.en}</div>`)); box.appendChild(h('<div class="ahelp">👆 Tap the right place on the screen</div>'));
  let wrong = 0;
  await new Promise(res => { actScene.tap = (x, y) => {
    const s = spots.reduce((b, s) => Math.hypot(s.x - x, s.y - y) < Math.hypot(b.x - x, b.y - y) ? s : b, spots[0]);
    if (Math.hypot(s.x - x, s.y - y) > 12) return;
    if (s === target) { placed = s; actScene.tap = null; sfx('cheer.ogg', .5); setAnim('cheer', 1500); burst('heart', 3); res(); }
    else { wrong++; sfx('refuse.ogg', .3); setAnim('refuse', 700); talk(`No, that's ${s.en}. Put it ${target.en}, please.`); }
  }; });
  talk(`The ${toy.en} is ${target.en}. Thank you!`);
  if (!world.toys.includes(toy.id)) { world.toys.push(toy.id); count('toys'); }
  saveWorld(); await sleep(1800);
  return { good: wrong === 0, stars: 2, diary: `I got a ${toy.en}.` };
}

// ================================================================ JOBS (adult and senior)
const MENU = [{ id: 'hamburger', p: 300 }, { id: 'pizza', p: 400 }, { id: 'riceball', p: 150 }, { id: 'icecream', p: 200 }, { id: 'juice', p: 150 }, { id: 'milk', p: 100 }];
async function jobShop() {
  // like the original's standWork(): our pet works inside the booth on the right,
  // the booth is drawn over it, and customers walk up from the left in front of the counter
  let cust = null, cx = -20, leaving = false;
  view.x = view.tx = 81; const BOOTH_FEET = 70;
  scene('stand', { draw(c, t) {
    const r = petRect(), cs = r.w, cell = meCell(t), acc = ACCS.find(a => a.id === shop.wearing);
    const rr = { x: Math.round(view.x - cs / 2), y: BOOTH_FEET - cs, w: cs, h: cs };
    if (acc && !acc.front) drawAcc(c, acc.id, cell, rr, false, pet.sprite);
    drawCell(c, img(charSrc(pet.sprite)), cell, cs, rr.x, rr.y, false);
    if (acc && acc.front) drawAcc(c, acc.id, cell, rr, false, pet.sprite);
    drawPic(c, 'misc/stand_01_booth', 0, 0);
    if (cust) {
      const goal = leaving ? -40 : 24;
      if (Math.abs(cx - goal) > .5) cx += Math.sign(goal - cx) * .6;
      drawChar(c, cust, cx, 96, Math.abs(cx - goal) > .5 ? animCell('walk', t) : 1, !leaving);
    }
  } });
  let wrong = 0;
  for (let k = 0; k < 2; k++) {
    cust = rnd([...CHARS.child, ...CHARS.teen, ...CHARS.adult]); cx = -20; leaving = false; await sleep(1300);
    const order = pickN(MENU, Math.random() < .7 ? 2 : 1), words = order.map(o => ITEM[o.id].a), line = `${words.join(' and ').replace(/^./, s => s.toUpperCase())}, please.`;
    talk(line, 'Customer');
    const picked = new Set();
    const box = panel('💼 Food stand');
    const grid = h('<div class="agrid" style="grid-template-columns:repeat(3,1fr)"></div>'); box.appendChild(grid);
    MENU.forEach(m => {
      const b = h('<button class="abtn"></button>'); b.appendChild(icon('food', FOOD_SPR[m.id], 52));
      b.appendChild(h(`<span class="al">${ITEM[m.id].en}</span>`)); b.appendChild(h(`<span class="yen">${m.p} yen</span>`));
      b.onclick = () => { picked.has(m.id) ? picked.delete(m.id) : picked.add(m.id); b.classList.toggle('sel'); sfx('ui_click_01.ogg', .3); };
      grid.appendChild(b);
    });
    const give = h('<button class="big">Here you are!</button>'); box.appendChild(give);
    while (true) {
      await wait(give);
      if (picked.size === order.length && order.every(o => picked.has(o.id))) break;
      wrong++; sfx('refuse.ogg', .3); talk(`No, no. ${line}`, 'Customer');
    }
    const total = order.reduce((t, o) => t + o.p, 0);
    talk('Thank you! How much is it?', 'Customer');
    wrong += await choose('💴 How much?', shuffle([total, total + 100, Math.max(100, total - 50)]).map(v => ({ label: `It's ${v} yen.`, v })), o => o.v === total, { cols: 1 });
    talk('Here you are. Thank you!', 'Customer'); setAnim('eat', 1000); sfx('task_complete.ogg', .5); leaving = true; await sleep(1600);
    cust = null;
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked at a food stand.' };
}
async function jobMail() {
  view.x = view.tx = 48;
  scene('postoffice', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t)); drawPic(c, 'misc/gift', view.x + 10, FEET - 22); } });
  let wrong = 0;
  for (const d of pickN(TOWN, 3)) {
    talk(`Please take this letter to ${d.en}.`, 'Post office');
    wrong += await choose('📮 Where does it go?', shuffle([d, ...pickN(TOWN.filter(x => x.id !== d.id), 2)]).map(p => ({ label: p.en, icon: picIcon('misc/building_' + p.id, 76), id: p.id })), o => o.id === d.id, { cols: 3 });
    talk('Thank you!'); setAnim('cheer', 900); await sleep(1000);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked as a mail carrier.' };
}

// ================================================================ HOLIDAYS
async function holiday() {
  const ev = eventToday();
  view.x = view.tx = 36;
  scene(shop.room || 'home_03', { draw(c, t) { drawDecor(c, t); drawMe(c, t, meCell(t)); } });
  if (!ev.art) $('emojiLayer').innerHTML = `<span class="decor ev">${ev.decor}</span>`;
  setAnim('cheer', 1500); talk(ev.hi);
  const reply = ev.reply || ev.hi, others = EVENTS.filter(e => e.id !== ev.id).map(e => e.reply || e.hi);
  const wrong = await choose('💬 Answer', shuffle([reply, ...pickN(others, 2)]).map(t => ({ label: t, t })), o => o.t === reply, { cols: 1 });
  const key = ev.id + new Date().getFullYear();
  let stars = 3;
  if (!world.events[key]) {
    world.events[key] = true;
    if (ev.gift.acc && !shop.acc.includes(ev.gift.acc)) { shop.acc.push(ev.gift.acc); shop.wearing = ev.gift.acc; store(SHOP_KEY, shop); }
    else stars += ev.gift.stars || 5;
    talk(ev.gift.line); confetti(); count('events');
  } else talk('Yay!');
  saveWorld(); setAnim('cheer', 2000); sfx('cheer_success.ogg', .5); await sleep(2200);
  return { good: wrong === 0, stars, diary: `${ev.hi.replace(/!$/, '')}! It was a fun day.` };
}

// ================================================================ choosing an activity for a wish
const ACTIVITIES = [
  { id: 'game', min: 2, cap: 2, w: 3, intro: () => rnd(["Let's play a game!", 'I want to play a game with you!']), run: () => rnd([gameCatch, gameNumber, gameSimon, gameSpell])() },
  { id: 'friend', min: 2, cap: 1, w: 2, intro: () => 'Knock, knock! Someone is at the door!', run: visitFriend },
  { id: 'mail', min: 2, cap: 1, w: 2, intro: () => "I got a letter! Let's read it!", run: readLetter },
  { id: 'garden', min: 2, cap: 1, w: 2, ok: () => !!gardenMode(), intro: () => "Let's go to the garden!", run: garden },
  { id: 'toy', min: 2, cap: 1, w: 1.2, intro: () => 'I got a present! A new toy!', run: toyTime },
  { id: 'job', min: 4, cap: 1, w: 2, intro: () => "It's time for work!", run: () => rnd([jobShop, jobMail])() },
  { id: 'holiday', min: 1, cap: 1, w: 50, ok: () => !!eventToday(), intro: () => eventToday().hi, run: holiday },
];
function pickActivity() {
  if (!pet || pet.lastWasAct) return null;
  const list = ACTIVITIES.filter(a => pet.stage >= a.min && todayN(a.id) < a.cap && (!a.ok || a.ok()));
  if (!list.length) return null;
  const hol = list.find(a => a.id === 'holiday');
  if (!hol && Math.random() > 0.35) return null;
  const pool = hol ? [hol] : list;
  const total = pool.reduce((t, a) => t + a.w, 0);
  let r = Math.random() * total;
  for (const a of pool) { r -= a.w; if (r <= 0) return a; }
  return pool[0];
}
