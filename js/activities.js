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
  { id: 'valentine', from: [2, 10], to: [2, 14], hi: "Happy Valentine's Day!", decor: '💝', gift: { stars: 5, line: 'This chocolate is for you!' },
    wishes: [{ en: "It's Valentine's Day! I want chocolate!", ok: ['chocolate'] }] },
  { id: 'hina', from: [3, 1], to: [3, 3], hi: "Happy Girls' Day!", decor: '🎎', gift: { stars: 5, line: 'Here are some stars for you!' }, wishes: [] },
  { id: 'children', from: [5, 1], to: [5, 5], hi: "Happy Children's Day!", decor: '🎏', gift: { stars: 5, line: 'Here are some stars for you!' },
    wishes: [{ en: "It's Children's Day! Let's play soccer!", ok: ['soccer'] }] },
  { id: 'tanabata', from: [7, 1], to: [7, 7], hi: "It's Tanabata! Let's make a wish!", decor: '🎋', gift: { stars: 5, line: 'I wrote my wish on paper!' },
    wishes: [{ en: 'My Tanabata wish: I want to be a singer!', ok: ['sing'] }] },
  { id: 'summer', from: [8, 1], to: [8, 20], hi: "It's summer vacation!", decor: '🍉', gift: { stars: 5, line: 'Here is a summer present!' },
    wishes: [{ en: "It's hot! Let's go to the sea!", ok: ['sea', 'swim'] }, { en: "It's hot! I want shaved ice!", ok: ['shavedice'] }] },
  { id: 'halloween', from: [10, 20], to: [10, 31], hi: 'Trick or treat!', reply: 'Happy Halloween!', decor: '🎃', gift: { acc: 'pumpkin_01', line: 'Here is a pumpkin for you!' },
    wishes: [{ en: 'Trick or treat! I want chocolate!', ok: ['chocolate'] }, { en: 'Trick or treat! I want cookies!', ok: ['cookie'] }] },
  { id: 'christmas', from: [12, 1], to: [12, 25], hi: 'Merry Christmas!', decor: '🎄', gift: { acc: 'santa_hat_01', line: 'Here is a Santa hat for you!' },
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

// ---------------------------------------------------------------- room decorations (toys + holiday)
function decorHtml() {
  const ev = eventToday();
  let h = ev ? `<span class="decor ev">${ev.decor}</span>` : '';
  world.toys.slice(-4).forEach((t, i) => { h += `<span class="decor toy" style="left:${4 + i * 9}%">${TOYS.find(x => x.id === t)?.e || ''}</span>`; });
  return h;
}

// ---------------------------------------------------------------- the activity panel
function actOpen(title, bg) {
  $('act').classList.remove('hidden');
  $('actTitle').textContent = title;
  $('actBody').innerHTML = '';
  $('act').style.setProperty('--act-bg', bg ? `url(${bgSrc(bg)})` : 'none');
  $('act').classList.toggle('hasbg', !!bg);
  return $('actBody');
}
function actClose() { $('act').classList.add('hidden'); $('actBody').innerHTML = ''; }
const wait = el => new Promise(r => el.addEventListener('click', r, { once: true }));
function h(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

// pixel sprite as a canvas element
function spriteEl(id, scale = 4, frame = 1, flip = false, acc = null) {
  const cv = document.createElement('canvas'); cv.className = 'spr';
  const im = img(charSrc(id));
  const draw = () => {
    const cs = im.naturalWidth / 4; cv.width = cv.height = 48;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const r = { x: 24 - cs / 2, y: 46 - cs, w: cs, h: cs };
    const a = acc && ACCS.find(x => x.id === acc);
    if (a && !a.front) drawAcc(c, a.id, frame, r, flip, id);
    drawCell(c, im, frame, cs, r.x, r.y, flip);
    if (a && a.front) drawAcc(c, a.id, frame, r, flip, id);
    cv.style.width = cv.style.height = 48 * scale + 'px';
  };
  if (im.complete && im.naturalWidth) draw(); else im.addEventListener('load', draw);
  return cv;
}
function myPet(scale = 4, frame = 1, flip = false) { return spriteEl(pet.sprite, scale, frame, flip, shop.wearing); }

// a question with answer buttons. Returns the number of wrong tries.
async function choose(box, items, isRight, { onWrong } = {}) {
  let wrongs = 0;
  return new Promise(res => {
    box.innerHTML = '';
    items.forEach(it => {
      const b = h(`<button class="choice">${it.html}</button>`);
      b.onclick = async () => {
        if (b.disabled) return;
        if (isRight(it)) { b.classList.add('right'); sfx('task_complete.ogg', .4); box.querySelectorAll('button').forEach(x => x.disabled = true); await sleep(500); res(wrongs); }
        else { wrongs++; b.classList.add('wrong'); b.disabled = true; sfx('refuse.ogg', .4); onWrong && onWrong(it); }
      };
      box.appendChild(b);
    });
  });
}
function itemHtml(it) { return `<span class="ce">${it.e}</span><span class="cl">${it.en}</span>`; }

// ================================================================ MINI-GAMES
const COUNTABLE = () => byCat('food').filter(i => /s$/.test(i.pl) && i.pl !== i.a && !/ /.test(i.pl));

async function gameCatch() {
  const body = actOpen('🎮 Catch game!', 'park');
  const pool = COUNTABLE(), target = rnd(pool), others = pickN(pool.filter(i => i.id !== target.id), 3), GOAL = 6;
  body.innerHTML = `<div class="gline">Catch ${GOAL} ${target.pl}!</div><div class="catch"><div class="gscore">0 / ${GOAL}</div><div class="gtime"></div></div><div class="ghelp">👆 Move</div>`;
  const area = body.querySelector('.catch');
  const me = myPet(2.4, 1); me.classList.add('catcher'); area.appendChild(me);
  let px = 400, caught = 0, items = [], running = true, t0 = performance.now(), last = 0;
  const W = () => area.clientWidth, H = () => area.clientHeight;
  area.addEventListener('pointermove', e => { const r = area.getBoundingClientRect(); px = (e.clientX - r.left) / (r.width / W()); });
  area.addEventListener('pointerdown', e => { const r = area.getBoundingClientRect(); px = (e.clientX - r.left) / (r.width / W()); });
  return new Promise(res => {
    const step = t => {
      if (!running) return;
      const left = Math.max(0, 30 - (t - t0) / 1000);
      body.querySelector('.gtime').textContent = '⏱ ' + Math.ceil(left);
      if (t - last > 650) {
        last = t;
        const it = Math.random() < 0.45 ? target : rnd(others);
        const el = h(`<div class="faller">${it.e}</div>`);
        const o = { it, el, x: 40 + Math.random() * (W() - 80), y: -60, v: 2.2 + Math.random() * 1.4 };
        area.appendChild(el); items.push(o);
      }
      me.style.left = (px - 58) + 'px';
      for (const o of items) {
        o.y += o.v; o.el.style.transform = `translate(${o.x - 30}px, ${o.y}px)`;
        if (!o.done && o.y > H() - 130 && o.y < H() - 60 && Math.abs(o.x - px) < 70) {
          o.done = true; o.el.remove();
          if (o.it.id === target.id) { caught++; sfx('eat.ogg', .4); body.querySelector('.gscore').textContent = `${caught} / ${GOAL}`; }
          else { sfx('refuse.ogg', .3); body.querySelector('.gline').textContent = `No! That's not ${target.a}!`; setTimeout(() => body.querySelector('.gline') && (body.querySelector('.gline').textContent = `Catch ${GOAL} ${target.pl}!`), 1200); }
        }
        if (o.y > H()) { o.done = true; o.el.remove(); }
      }
      items = items.filter(o => !o.done);
      if (caught >= GOAL || left <= 0) { running = false; return res(endGame(caught >= GOAL, `I caught ${caught} ${caught === 1 ? target.en : target.pl}!`, 'I played a catch game.')); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

async function gameNumber() {
  const body = actOpen('🎮 Guess my number!', null);
  const max = pet.stage >= 3 ? 50 : 20, n = 1 + Math.floor(Math.random() * max), maxTries = max === 50 ? 7 : 5;
  body.innerHTML = `<div class="nrow"><div class="npet"></div><div class="gbub">I'm thinking of a number from 1 to ${max}. What is it?</div></div><div class="grid${max === 50 ? ' g50' : ''}"></div><div class="gscore">Tries: 0 / ${maxTries}</div>`;
  body.querySelector('.npet').appendChild(myPet(2.6, 1));
  const grid = body.querySelector('.grid'), bub = body.querySelector('.gbub');
  let tries = 0;
  return new Promise(res => {
    for (let i = 1; i <= max; i++) {
      const b = h(`<button class="nb">${i}</button>`);
      b.onclick = async () => {
        tries++; body.querySelector('.gscore').textContent = `Tries: ${tries} / ${maxTries}`;
        if (i === n) { b.classList.add('right'); bub.textContent = `Yes! It's ${n}!`; sfx('cheer.ogg', .5); grid.querySelectorAll('button').forEach(x => x.disabled = true); await sleep(1200); return res(endGame(true, `You got it in ${tries} ${tries === 1 ? 'try' : 'tries'}!`, 'I played a number game.')); }
        sfx('pop_01.mp3', .4);
        bub.textContent = i < n ? `No. It's bigger than ${i}.` : `No. It's smaller than ${i}.`;
        grid.querySelectorAll('button').forEach(x => { const v = +x.textContent; if ((i < n && v <= i) || (i > n && v >= i)) { x.disabled = true; x.classList.add('out'); } });
        if (tries >= maxTries) { bub.textContent = `It was ${n}!`; grid.querySelectorAll('button').forEach(x => x.disabled = true); await sleep(1500); res(endGame(false, `It was ${n}. Let's play again next time!`, 'I played a number game.')); }
      };
      grid.appendChild(b);
    }
  });
}

const MOVES = [
  { id: 'jump', en: 'Jump!', e: '⬆️', lb: 'jump' }, { id: 'left', en: 'Go left!', e: '⬅️', lb: 'go left' },
  { id: 'right', en: 'Go right!', e: '➡️', lb: 'go right' }, { id: 'sit', en: 'Sit down!', e: '🪑', lb: 'sit down' },
  { id: 'stand', en: 'Stand up!', e: '🧍', lb: 'stand up' }, { id: 'turn', en: 'Turn around!', e: '🔄', lb: 'turn around' },
  { id: 'clap', en: 'Clap your hands!', e: '👏', lb: 'clap' }, { id: 'dance', en: 'Dance!', e: '💃', lb: 'dance' },
];
async function gameSimon() {
  const body = actOpen('🎮 Copy me!', null);
  const lens = pet.stage >= 3 ? [2, 3, 4] : [2, 3];
  body.innerHTML = `<div class="nrow"><div class="npet"></div><div class="gbub">Watch me! Then copy me!</div></div><div class="moves"></div><div class="gscore"></div>`;
  const me = myPet(2.6, 1); body.querySelector('.npet').appendChild(me);
  const bub = body.querySelector('.gbub'), box = body.querySelector('.moves');
  MOVES.forEach(m => box.appendChild(h(`<button class="choice" data-m="${m.id}" disabled><span class="ce">${m.e}</span><span class="cl">${m.lb}</span></button>`)));
  let wins = 0;
  for (let r = 0; r < lens.length; r++) {
    const seq = Array.from({ length: lens[r] }, () => rnd(MOVES));
    for (let attempt = 0; attempt < 2; attempt++) {
      body.querySelector('.gscore').textContent = `Round ${r + 1} / ${lens.length}`;
      box.querySelectorAll('button').forEach(b => b.disabled = true);
      bub.textContent = 'Watch!'; await sleep(900);
      for (const m of seq) { bub.textContent = m.en; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); sfx('jump.ogg', .3); me.style.transform = m.id === 'jump' ? 'translateY(-20px)' : m.id === 'left' ? 'translateX(-20px)' : m.id === 'right' ? 'translateX(20px)' : m.id === 'turn' ? 'scaleX(-1)' : m.id === 'sit' ? 'translateY(12px)' : ''; await sleep(1300); me.style.transform = ''; bub.textContent = '…'; await sleep(250); }
      bub.textContent = 'Your turn!';
      box.querySelectorAll('button').forEach(b => b.disabled = false);
      const ok = await new Promise(res => {
        let i = 0;
        box.querySelectorAll('button').forEach(b => b.onclick = () => {
          if (b.dataset.m === seq[i].id) { i++; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 250); sfx('pop_01.mp3', .3); if (i === seq.length) res(true); }
          else res(false);
        });
      });
      if (ok) { wins++; bub.textContent = 'Great!'; sfx('cheer.ogg', .4); await sleep(900); break; }
      bub.textContent = attempt === 0 ? 'Oops! Watch again!' : 'Oops! Next one!'; sfx('refuse.ogg', .3); await sleep(1100);
    }
  }
  return endGame(wins === lens.length, `You copied ${wins} of ${lens.length}!`, 'I played Copy Me.');
}

async function gameSpell() {
  const body = actOpen('🎮 Balloon spelling!', 'sky');
  const words = ITEMS.filter(i => ['food', 'drink', 'play', 'study', 'wear'].includes(i.cat) && /^[a-z]{3,6}$/.test(i.en) && unlocked(pet.stage, i.cat));
  const w = rnd(words), word = w.en.toUpperCase();
  const extra = 'ABCDEFGHIJKLMNOPRSTUW'.split('').filter(l => !word.includes(l));
  const letters = shuffle([...word.split(''), ...pickN(extra, 3)]);
  body.innerHTML = `<div class="spellTop"><span class="spic">${w.e}</span><span class="blanks">${word.split('').map(() => '<b>_</b>').join('')}</span></div><div class="sky"></div><div class="gline">Pop the letters in order!</div>`;
  const sky = body.querySelector('.sky'), blanks = body.querySelectorAll('.blanks b');
  let i = 0, wrong = 0;
  return new Promise(res => {
    const cols = ['#ff5a7a', '#ffb62e', '#4fc3ff', '#6fdc4a', '#c77dff', '#ff8a1f'];
    letters.forEach((L, k) => {
      const b = h(`<button class="balloon" style="left:${6 + k * (88 / letters.length)}%;--c:${cols[k % cols.length]};animation-delay:-${Math.random() * 6}s">${L}</button>`);
      b.onclick = async () => {
        if (L === word[i]) {
          blanks[i].textContent = L; i++; b.classList.add('popped'); sfx('pop_01.mp3', .5);
          if (i === word.length) { await sleep(600); res(endGame(wrong <= 2, `${w.en.charAt(0).toUpperCase() + w.en.slice(1)}! You spelled it!`, `I spelled "${w.en}".`)); }
        } else { wrong++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); sfx('refuse.ogg', .3); }
      };
      sky.appendChild(b);
    });
  });
}

async function endGame(won, line, diary) {
  const body = $('actBody');
  const end = h(`<div class="endcard"><div class="endpet"></div><div class="endtxt">${won ? 'You win!' : 'Good try!'}</div><div class="endline">${line}</div><button class="big">OK</button></div>`);
  end.querySelector('.endpet').appendChild(myPet(3, won ? 2 : 1));
  body.appendChild(end); sfx(won ? 'cheer_success.ogg' : 'task_complete.ogg', .5);
  if (won) { confetti(); count('gamesWon'); }
  await wait(end.querySelector('button'));
  return { good: won, stars: won ? 4 : 2, diary };
}

// ================================================================ FRIENDS
const FRIEND_NAMES = ['Momo', 'Ken', 'Yui', 'Sora', 'Hana', 'Riku', 'Emma', 'Leo', 'Lily', 'Max', 'Mia', 'Taro'];
function friendQuestions(f) {
  const bd = pet.born ? new Date(pet.born) : new Date();
  const myBd = `My birthday is ${MONTHS[bd.getMonth()]} ${bd.getDate()}.`;
  const otherBd = `My birthday is ${MONTHS[(bd.getMonth() + 5) % 12]} ${((bd.getDate() + 9) % 28) + 1}.`;
  const sport = rnd(byCat('play').filter(i => i.sport)), food = rnd(byCat('food')), place = rnd(byCat('go'));
  const subj = rnd(byCat('study')), canDo = rnd([['swim', 'swim'], ['cook', 'cook'], ['ride a bike', 'bike'], ['skate', 'skate'], ['play the piano', 'piano']]);
  const Q = [
    { q: `Do you like ${sport.en}?`, a: ['Yes, I do.', "No, I don't."], x: ['Yes, I can.', "I'm fine."] },
    { q: `Can you ${canDo[0]}?`, a: ['Yes, I can.', "No, I can't."], x: ['Yes, I do.', "It's sunny."] },
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
  const body = actOpen(`🚪 ${name} is here!`, shop.room || 'home_03');
  body.innerHTML = `<div class="duo"><div class="side me"></div><div class="talk"><div class="fbub"></div><div class="answers"></div></div><div class="side them"></div></div>`;
  body.querySelector('.me').appendChild(myPet(3.2, 1));
  body.querySelector('.them').appendChild(spriteEl(f.sprite, 3.2, 1, true));
  const bub = body.querySelector('.fbub'), ans = body.querySelector('.answers');
  const say2 = t => { bub.textContent = t; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); };
  const opt = arr => arr.map(t => ({ html: t, t }));
  let wrong = 0;
  sfx('cute.ogg', .4);
  if (isNew) {
    say2(`Hi! I'm ${name}. What's your name?`);
    wrong += await choose(ans, shuffle(opt([`I'm ${pet.name}.`, "I'm fine.", "I'm hungry."])), o => o.t === `I'm ${pet.name}.`);
    say2(`Nice to meet you, ${pet.name}!`);
    wrong += await choose(ans, shuffle(opt(['Nice to meet you, too!', 'Good night!', 'See you!'])), o => o.t === 'Nice to meet you, too!');
  } else {
    say2(`Hi, ${pet.name}! How are you?`);
    wrong += await choose(ans, shuffle(opt(["I'm good!", `I'm ${age()} years old.`, "It's Monday."])), o => o.t === "I'm good!");
  }
  for (const q of friendQuestions(f)) {
    say2(q.q);
    const right = rnd(q.a);
    wrong += await choose(ans, shuffle(opt([right, ...q.x])), o => o.t === right);
    say2(rnd(['Me too!', 'Cool!', 'Nice!', 'Really? Wow!']));
    await sleep(900);
  }
  f.hearts = Math.min(5, f.hearts + 1);
  let giftLine = '', stars = 3;
  if (f.hearts === 5 && !f.bff) {
    f.bff = true; count('bff');
    const acc = ACCS.find(a => !shop.acc.includes(a.id) && a.price <= 60);
    if (acc) { shop.acc.push(acc.id); store(SHOP_KEY, shop); giftLine = `We're best friends! This ${acc.en.toLowerCase()} is for you!`; }
  }
  say2(giftLine || 'This is for you!');
  wrong += await choose(ans, shuffle(opt(['Thank you!', "You're welcome.", 'Good morning!'])), o => o.t === 'Thank you!');
  say2('Bye! See you!');
  wrong += await choose(ans, shuffle(opt(['See you!', 'Nice to meet you.', 'Happy birthday!'])), o => o.t === 'See you!');
  body.querySelector('.them').classList.add('leave');
  ans.innerHTML = `<div class="hearts">${'💗'.repeat(f.hearts)}${'🤍'.repeat(5 - f.hearts)}</div>`;
  await sleep(1400);
  world.friends[name] = f; setCount('friends', Object.keys(world.friends).length);
  return { good: wrong === 0, stars, diary: `My friend ${name} came to my house.` };
}

// ================================================================ LETTERS
function makeLetter() {
  const known = Object.keys(world.friends);
  const from = known.length ? rnd(known) : rnd(FRIEND_NAMES);
  const trip = rnd(byCat('trip')), food = rnd(byCat('food')), sport = rnd(byCat('play').filter(i => i.sport)), place = rnd(byCat('go'));
  const kinds = [
    () => ({ text: `I went to ${trip.en}. I ate ${food.a}. It was delicious!`, q: `Where did ${from} go?`, right: trip, pool: byCat('trip') }),
    () => ({ text: `I went to ${trip.en}. I ate ${food.a}. It was delicious!`, q: `What did ${from} eat?`, right: food, pool: byCat('food') }),
    () => ({ text: `I went to ${place.en} with my family. I played ${sport.en}. It was fun!`, q: `What did ${from} play?`, right: sport, pool: byCat('play').filter(i => i.sport) }),
    () => ({ text: `I went to ${place.en} with my family. I played ${sport.en}. It was fun!`, q: `Where did ${from} go?`, right: place, pool: byCat('go') }),
  ];
  const k = rnd(kinds)();
  return { from, ...k, choices: shuffle([k.right, ...pickN(k.pool.filter(i => i.id !== k.right.id), 2)]) };
}
async function readLetter() {
  const L = makeLetter();
  const body = actOpen('💌 You got a letter!', null);
  body.innerHTML = `<div class="mail"><div class="letter"><p class="dear">Dear ${pet.name},</p><p>${L.text}</p><p class="from">From, ${L.from}</p></div><div class="lq"><div class="gline">${L.q}</div><div class="answers"></div></div></div>`;
  sfx('pop_01.mp3', .5);
  const wrong = await choose(body.querySelector('.answers'), L.choices.map(c => ({ html: itemHtml(c), id: c.id })), o => o.id === L.right.id);
  world.letters.unshift({ d: dayKey(), from: L.from, text: L.text }); if (world.letters.length > 40) world.letters.pop();
  count('letters');
  await sleep(500);
  return { good: wrong === 0, stars: 2, diary: `I got a letter from ${L.from}.` };
}

// ================================================================ GARDEN (grows over real days, never dies)
const SEEDS = ['tomato', 'carrot', 'corn', 'strawberry', 'melon'];
function gardenMode() {
  const g = world.garden, d = dayKey();
  if (g.some(p => p && p.stage >= 3)) return 'harvest';
  if (g.some(p => p && p.stage < 3 && p.watered !== d)) return 'water';
  if (g.some(p => !p)) return 'plant';
  return null;
}
async function garden() {
  const mode = gardenMode(), g = world.garden, d = dayKey();
  const body = actOpen('🌱 The garden', 'park2');
  body.innerHTML = `<div class="gline gtop"></div><div class="plots"></div><div class="answers"></div>`;
  const line = body.querySelector('.gtop'), plots = body.querySelector('.plots');
  const plantE = p => !p ? '' : p.stage >= 3 ? ITEM[p.id].e : ['🌱', '🌿', '🪴'][p.stage];
  const draw = () => {
    plots.innerHTML = '';
    g.forEach((p, i) => plots.appendChild(h(`<button class="plot" data-i="${i}"><span class="sign">${p ? ITEM[p.id].e + '<b>' + ITEM[p.id].pl + '</b>' : ''}</span><span class="plant">${plantE(p)}</span></button>`)));
  };
  draw();
  let wrong = 0, diary = '', good = true;
  if (mode === 'plant') {
    const seed = ITEM[rnd(SEEDS.filter(s => !g.some(p => p && p.id === s)))];
    line.textContent = `Let's plant ${seed.pl}!`;
    wrong = await choose(body.querySelector('.answers'), shuffle([seed, ...pickN(SEEDS.filter(s => s !== seed.id).map(s => ITEM[s]), 2)]).map(c => ({ html: `<span class="ce">${c.e}</span><span class="cl">${c.pl} seeds</span>`, id: c.id })), o => o.id === seed.id);
    const i = g.findIndex(p => !p); g[i] = { id: seed.id, stage: 0, watered: d };
    draw(); sfx('jump.ogg', .4); line.textContent = `We planted ${seed.pl}! Let's water them every day.`;
    diary = `I planted ${seed.pl}.`;
  } else {
    const targets = g.map((p, i) => [p, i]).filter(([p]) => p && (mode === 'harvest' ? p.stage >= 3 : p.stage < 3 && p.watered !== d));
    const [p, idx] = rnd(targets);
    line.textContent = mode === 'harvest' ? `The ${ITEM[p.id].pl} are ready! Let's pick them!` : `Water the ${ITEM[p.id].pl}, please.`;
    body.querySelector('.answers').innerHTML = `<div class="ghelp">👆 Tap the right plant</div>`;
    wrong = await new Promise(res => {
      let w = 0;
      plots.querySelectorAll('.plot').forEach(b => b.onclick = () => {
        if (+b.dataset.i === idx) res(w);
        else if (g[+b.dataset.i]) { w++; b.classList.add('shake'); sfx('refuse.ogg', .3); setTimeout(() => b.classList.remove('shake'), 400); }
      });
    });
    const b = plots.querySelector(`[data-i="${idx}"]`);
    if (mode === 'harvest') {
      b.classList.add('pick'); sfx('cheer_success.ogg', .5); await sleep(900);
      g[idx] = null; count('harvests'); draw();
      line.textContent = `Yummy ${ITEM[p.id].pl}!`; diary = `I picked ${ITEM[p.id].pl}.`;
    } else {
      b.insertAdjacentHTML('beforeend', '<span class="drops">💧💧💧</span>'); sfx('pop_01.mp3', .5); await sleep(1000);
      p.stage++; p.watered = d; draw();
      line.textContent = p.stage >= 3 ? `Wow! The ${ITEM[p.id].pl} are ready!` : `They're growing!`;
      diary = `I watered the ${ITEM[p.id].pl}.`;
    }
  }
  saveWorld(); await sleep(1500);
  return { good: wrong === 0 && good, stars: mode === 'harvest' ? 4 : 2, diary };
}

// ================================================================ TOYS (prepositions: on / in / under / by)
const TOYS = [
  { id: 'bear', e: '🧸', en: 'teddy bear' }, { id: 'robot', e: '🤖', en: 'robot' }, { id: 'doll', e: '🪆', en: 'doll' },
  { id: 'car', e: '🚗', en: 'toy car' }, { id: 'kite', e: '🪁', en: 'kite' }, { id: 'yoyo', e: '🪀', en: 'yo-yo' },
  { id: 'duck', e: '🦆', en: 'rubber duck' }, { id: 'ball', e: '🎾', en: 'ball' }, { id: 'train', e: '🚂', en: 'toy train' },
];
const SPOTS = [
  { id: 'onbed', en: 'on the bed', x: 13, y: 52 }, { id: 'bybed', en: 'by the bed', x: 27, y: 80 },
  { id: 'ondesk', en: 'on the desk', x: 46, y: 26 }, { id: 'underdesk', en: 'under the desk', x: 46, y: 70 },
  { id: 'onchair', en: 'on the chair', x: 70, y: 50 }, { id: 'bychair', en: 'by the chair', x: 79, y: 82 },
  { id: 'inbox', en: 'in the box', x: 89, y: 68 }, { id: 'onbox', en: 'on the box', x: 89, y: 30 },
];
async function toyTime() {
  const toy = TOYS.find(t => !world.toys.includes(t.id)) || rnd(TOYS);
  const spot = rnd(SPOTS);
  const body = actOpen(`🎁 A new ${toy.en}!`, null);
  body.innerHTML = `<div class="gline">I got a new ${toy.en}! Put it ${spot.en}, please.</div>
    <div class="toyroom"><span class="f bed">🛏️</span><div class="f desk"><i></i><i></i><i></i></div><span class="f chair">🪑</span><span class="f box">📦</span>
    <span class="holding">${toy.e}</span></div><div class="ghelp">👆 Tap the right place</div>`;
  const room = body.querySelector('.toyroom');
  SPOTS.forEach(s => room.appendChild(h(`<button class="spot" data-s="${s.id}" style="left:${s.x}%;top:${s.y}%"></button>`)));
  let wrong = 0;
  await new Promise(res => room.querySelectorAll('.spot').forEach(b => b.onclick = () => {
    if (b.dataset.s === spot.id) { b.classList.add('placed'); b.textContent = toy.e; room.querySelector('.holding').remove(); sfx('cheer.ogg', .5); res(); }
    else { wrong++; b.classList.add('shake'); sfx('refuse.ogg', .3); setTimeout(() => b.classList.remove('shake'), 400); }
  }));
  body.querySelector('.gline').textContent = `The ${toy.en} is ${spot.en}. Thank you!`;
  if (!world.toys.includes(toy.id)) { world.toys.push(toy.id); count('toys'); }
  saveWorld(); await sleep(1600);
  return { good: wrong === 0, stars: 2, diary: `I got a ${toy.en}.` };
}

// ================================================================ JOBS (adult and senior)
const MENU = [
  { id: 'hamburger', p: 300 }, { id: 'hotdog', p: 250 }, { id: 'fries', p: 200 },
  { id: 'icecream', p: 200 }, { id: 'juice', p: 150 }, { id: 'salad', p: 150 },
];
async function jobShop() {
  const body = actOpen('💼 Job: food stand', 'market');
  body.innerHTML = `<div class="duo"><div class="side them"></div><div class="talk"><div class="fbub"></div><div class="menu"></div><div class="answers"></div></div><div class="side me"></div></div>`;
  body.querySelector('.me').appendChild(myPet(2.8, 1));
  const bub = body.querySelector('.fbub'), menu = body.querySelector('.menu'), ans = body.querySelector('.answers');
  let wrong = 0;
  for (let c = 0; c < 2; c++) {
    const them = body.querySelector('.them'); them.innerHTML = ''; them.appendChild(spriteEl(rnd([...CHARS.child, ...CHARS.teen, ...CHARS.adult]), 2.8, 1, false));
    const order = pickN(MENU, 1 + (Math.random() < 0.7 ? 1 : 0));
    const words = order.map(o => ITEM[o.id].a);
    bub.textContent = `${words.join(' and ').replace(/^./, s => s.toUpperCase())}, please.`;
    const picked = new Set();
    menu.innerHTML = ''; ans.innerHTML = '';
    MENU.forEach(m => {
      const b = h(`<button class="choice mi"><span class="ce">${ITEM[m.id].e}</span><span class="cl">${ITEM[m.id].en}</span><span class="yen">${m.p} yen</span></button>`);
      b.onclick = () => { picked.has(m.id) ? picked.delete(m.id) : picked.add(m.id); b.classList.toggle('sel'); sfx('ui_click_01.ogg', .3); };
      menu.appendChild(b);
    });
    const give = h(`<button class="big">Here you are!</button>`); ans.appendChild(give);
    while (true) {
      await wait(give);
      if (picked.size === order.length && order.every(o => picked.has(o.id))) break;
      wrong++; sfx('refuse.ogg', .3); bub.textContent = `No, no. ${words.join(' and ').replace(/^./, s => s.toUpperCase())}, please.`;
    }
    menu.innerHTML = '';
    const total = order.reduce((t, o) => t + o.p, 0);
    bub.textContent = 'Thank you! How much is it?';
    wrong += await choose(ans, shuffle([total, total + 100, Math.max(100, total - 50)]).map(v => ({ html: `It's ${v} yen.`, v })), o => o.v === total);
    bub.textContent = 'Here you are. Thank you!'; sfx('task_complete.ogg', .5); await sleep(1200);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked at a food stand.' };
}
const DELIVER = [
  { to: 'zoo', clue: 'the place with lions and elephants' }, { to: 'library', clue: 'the place with many books' },
  { to: 'aquarium', clue: 'the place with fish and dolphins' }, { to: 'bakery', clue: 'the shop with bread' },
  { to: 'flowershop', clue: 'the shop with flowers' }, { to: 'station', clue: 'the place with trains' },
  { to: 'museum', clue: 'the place with dinosaurs' }, { to: 'school', clue: 'the place with teachers and students' },
  { to: 'supermarket', clue: 'the shop with vegetables and meat' }, { to: 'park', clue: 'the place with slides and swings' },
];
async function jobMail() {
  const body = actOpen('💼 Job: mail carrier', 'postoffice');
  body.innerHTML = `<div class="duo"><div class="side me"></div><div class="talk"><div class="fbub"></div><div class="answers"></div></div><div class="side"><div class="parcel">📨</div></div></div>`;
  body.querySelector('.me').appendChild(myPet(2.8, 1));
  const bub = body.querySelector('.fbub'), ans = body.querySelector('.answers');
  let wrong = 0;
  for (const d of pickN(DELIVER, 3)) {
    bub.textContent = `This letter is for ${d.clue}.`;
    const choices = shuffle([d.to, ...pickN(DELIVER.filter(x => x.to !== d.to).map(x => x.to), 2)]).map(id => ({ html: itemHtml(ITEM[id]), id }));
    wrong += await choose(ans, choices, o => o.id === d.to);
    bub.textContent = `Delivered to ${ITEM[d.to].en}!`; await sleep(900);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked as a mail carrier.' };
}

// ================================================================ HOLIDAYS
async function holiday() {
  const ev = eventToday();
  const body = actOpen(`${ev.decor} ${ev.hi}`, shop.room || 'home_03');
  const reply = ev.reply || ev.hi;
  const others = EVENTS.filter(e => e.id !== ev.id).map(e => e.reply || e.hi);
  body.innerHTML = `<div class="duo"><div class="side me"></div><div class="talk"><div class="fbub">${ev.hi}</div><div class="answers"></div></div><div class="side"><div class="parcel">${ev.decor}</div></div></div>`;
  body.querySelector('.me').appendChild(myPet(3.2, 2));
  const wrong = await choose(body.querySelector('.answers'), shuffle([reply, ...pickN(others, 2)]).map(t => ({ html: t, t })), o => o.t === reply);
  const bub = body.querySelector('.fbub');
  const key = ev.id + new Date().getFullYear();
  let stars = 3;
  if (!world.events[key]) {
    world.events[key] = true;
    if (ev.gift.acc && !shop.acc.includes(ev.gift.acc)) { shop.acc.push(ev.gift.acc); shop.wearing = ev.gift.acc; store(SHOP_KEY, shop); }
    else stars += ev.gift.stars || 5;
    bub.textContent = ev.gift.line; confetti(); count('events');
  } else bub.textContent = 'Yay!';
  saveWorld(); sfx('cheer_success.ogg', .5); await sleep(2000);
  return { good: wrong === 0, stars, diary: `${ev.hi.replace(/!$/, '')}! It was a fun day.` };
}

// ================================================================ choosing an activity for a wish
const ACTIVITIES = [
  { id: 'game', min: 2, cap: 2, w: 3, intro: () => rnd(["Let's play a game!", 'I want to play a game with you!']), run: () => rnd([gameCatch, gameNumber, gameSimon, gameSpell])() },
  { id: 'friend', min: 2, cap: 1, w: 2, intro: () => 'Knock, knock! Someone is at the door!', run: visitFriend },
  { id: 'mail', min: 2, cap: 1, w: 2, intro: () => 'I got a letter! Let\'s read it!', run: readLetter },
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
