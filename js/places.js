// ============================================================
//  Tama Talk – town, school, animals, more games, jobs, goals
//  All of these are activities that REPLACE a wish (never extra),
//  with simple New Horizon 5 & 6 English and Tamaweb's artwork.
// ============================================================

// ---------------------------------------------------------------- small helpers
const LEAF = { red: 7, yellow: 3, green: 5, brown: 8, orange: 2 };          // cells in misc/leaves_01 (13px, 4 cols)
const APPLE = { red: 0, green: 1, orange: 2, yellow: 3 };                    // misc/apples_01 (8px each)
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function drawCellOf(c, name, cs, cols, n, x, y, size) {
  const im = img(`assets/${name}.png`); if (!im.complete || !im.naturalWidth) return;
  const i = n - 1; size = size || cs;
  c.drawImage(im, (i % cols) * cs, Math.floor(i / cols) * cs, cs, cs, Math.round(x), Math.round(y), size, size);
}
function cellIcon(name, cs, cols, n, px = 56) {
  const cv = document.createElement('canvas'); cv.width = cv.height = cs; cv.className = 'pix'; cv.style.width = cv.style.height = px + 'px';
  const go = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; drawCellOf(c, name, cs, cols, n, 0, 0); };
  const im = img(`assets/${name}.png`); if (im.complete) go(); else im.addEventListener('load', go);
  return cv;
}
const GO_BACK = () => { view.x = view.tx = 48; };

// ================================================================ TOWN (like the original's street: one building at a time, ◀ ▶, go in)
const BUILDINGS = [
  { id: 'park', en: 'the park' }, { id: 'school', en: 'school' }, { id: 'market', en: 'the market' },
  { id: 'restaurant', en: 'the restaurant' }, { id: 'hospital', en: 'the hospital' }, { id: 'mall', en: 'the mall' },
  { id: 'arcade', en: 'the arcade' }, { id: 'post_office', en: 'the post office' },
];
async function goOut() {
  const dest = rnd(BUILDINGS);
  let idx = (BUILDINGS.indexOf(dest) + 2 + Math.floor(Math.random() * (BUILDINGS.length - 3))) % BUILDINGS.length;
  let slide = 0;
  view.x = view.tx = 48;
  scene('street', { draw(c, t) {
    if (slide) slide += slide > 0 ? -6 : 6;
    if (Math.abs(slide) < 6) slide = 0;
    drawPic(c, 'misc/building_' + BUILDINGS[idx].id, slide, -4);
    drawPic(c, 'bg/street_decor', 0, 0);
    stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip);
  } });
  talk(`I want to go to ${dest.en}.`);
  const box = panel('🗺️ Town');
  const name = h(`<div class="aword placename">${BUILDINGS[idx].en}</div>`);
  const row = h('<div class="arrows"><button class="abtn txt arr">◀</button><button class="big">Go in!</button><button class="abtn txt arr">▶</button></div>');
  box.append(name, row, h('<div class="ahelp">◀ ▶ Find the place</div>'));
  const [prev, go, next] = row.querySelectorAll('button');
  const move = d => { idx = (idx + d + BUILDINGS.length) % BUILDINGS.length; slide = d * 96; name.textContent = BUILDINGS[idx].en; sfx('ui_click_01.ogg', .3); view.flip = d > 0; setAnim('walk', 500); };
  prev.onclick = () => move(-1); next.onclick = () => move(1);
  let wrong = 0;
  await new Promise(res => go.onclick = () => {
    if (BUILDINGS[idx].id === dest.id) { sfx('swoosh_01.ogg', .4); res(); }
    else { wrong++; setAnim('refuse', 800); sfx('refuse.ogg', .3); talk(`This is ${BUILDINGS[idx].en}. I want to go to ${dest.en}.`); }
  });
  count('outings');
  const r = await PLACES[dest.id]();
  return { good: wrong === 0 && r.good, stars: r.stars + 1, diary: r.diary || `I went to ${dest.en}.` };
}

const PLACES = {
  park: () => (world.animal && Math.random() < .5) ? walkDog() : leavesGame(),
  school: () => rnd([classFeelings, classCups, classJump])(),
  market: shopping,
  restaurant: restaurant,
  hospital: doctor,
  mall: buyPresent,
  arcade: () => rnd([appleStop, gameNumber])(),
  post_office: readLetter,
};

// ---------------------------------------------------------------- park: catch the leaves (original leavesGame)
async function leavesGame() {
  const colors = Object.keys(LEAF), col = rnd(colors), GOAL = 5;
  let caught = 0, leaves = [], last = 0, t0 = performance.now(), mx = 48, done = false;
  view.x = view.tx = 48;
  talk(`Catch ${GOAL} ${col} leaves!`);
  const box = panel('🍂 The park');
  box.appendChild(cellIcon('misc/leaves_01', 13, 4, LEAF[col], 64)); box.appendChild(h(`<div class="aword">${col}</div>`));
  const score = h(`<div class="ascore">0 / ${GOAL}</div>`), timer = h('<div class="atime">⏱ 30</div>');
  box.append(score, timer, h('<div class="ahelp">👆 Move your pet on the screen</div>'));
  return new Promise(res => scene('park', {
    move: x => { mx = x; },
    draw(c, t) {
      const left = Math.max(0, 30 - (t - t0) / 1000); timer.textContent = '⏱ ' + Math.ceil(left);
      if (!done && t - last > 700) { last = t; const k = Math.random() < .45 ? col : rnd(colors); leaves.push({ k, x: 6 + Math.random() * 84, y: -14, v: .3 + Math.random() * .2, w: Math.random() * 6 }); }
      view.tx = Math.max(10, Math.min(86, mx)); stepMe();
      const r = petRect();
      for (const o of leaves) {
        o.y += o.v; const x = o.x + Math.sin((t / 300) + o.w) * 4;
        drawCellOf(c, 'misc/leaves_01', 13, 4, LEAF[o.k], x - 6, o.y);
        if (!o.gone && o.y + 12 > r.y + 4 && o.y < FEET - 4 && Math.abs(x - view.x) < r.w / 2 + 4) {
          o.gone = true;
          if (o.k === col) { caught++; score.textContent = `${caught} / ${GOAL}`; sfx('pop_01.mp3', .4); burst('heart', 1); }
          else { sfx('refuse.ogg', .3); setAnim('refuse', 600); talk(`No! That's ${o.k}. Catch ${col} leaves!`); }
        }
        if (o.y > 96) o.gone = true;
      }
      leaves = leaves.filter(o => !o.gone);
      drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip);
      if (!done && (caught >= GOAL || left <= 0)) { done = true; res(gameEnd(caught >= GOAL, `I caught ${caught} ${col} leaves!`, 'I played in the park.')); }
    },
  }));
}

// ---------------------------------------------------------------- arcade: stop on the right apple (original barTimingGame idea)
async function appleStop() {
  const cols = Object.keys(APPLE); let wins = 0;
  view.x = view.tx = 48;
  let pos = 0, speed = .9, running = true, target = rnd(cols);
  scene('arcade2', { draw(c, t) {
    drawMe(c, t, meCell(t));
    // the bar
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(6, 10, 84, 16);
    for (let i = 0; i < 8; i++) { const im = img('assets/misc/apples_01.png'); if (im.complete) c.drawImage(im, (i % 4) * 8, 0, 8, 8, 8 + i * 10.4, 14, 8, 8); }
    if (running) { pos += speed; if (pos > 80 || pos < 0) speed = -speed; }
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(6 + pos, 11, 10, 14);
  } });
  for (let round = 0; round < 3; round++) {
    target = rnd(cols); running = true;
    talk(`Stop on the ${target} apple!`);
    const box = panel(`🕹️ Stop! &nbsp;${round + 1}/3`);
    box.appendChild(cellIcon('misc/apples_01', 8, 4, APPLE[target] + 1, 56)); box.appendChild(h(`<div class="aword">${target}</div>`));
    const stop = h('<button class="big stopbtn">STOP!</button>'); box.appendChild(stop);
    await wait(stop); running = false;
    const slot = Math.max(0, Math.min(7, Math.round((pos - 1) / 10.4)));
    const got = cols[slot % 4];
    if (got === target) { wins++; setAnim('cheer', 900); sfx('cheer.ogg', .4); talk(`Yes! A ${target} apple!`); }
    else { setAnim('refuse', 900); sfx('refuse.ogg', .3); talk(`Oh no! That's a ${got} apple.`); }
    await sleep(1300); speed = Math.sign(speed) * (Math.abs(speed) + .3);
  }
  return gameEnd(wins >= 2, `You got ${wins} of 3!`, 'I played at the arcade.');
}

// ---------------------------------------------------------------- market: shopping list
async function shopping() {
  const pool = ['banana', 'bread', 'milk', 'juice', 'riceball', 'cake', 'icecream', 'sushi', 'pizza', 'salad'];
  const list = pickN(pool, 2);
  view.x = view.tx = 30;
  scene('market', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t)); } });
  talk(`Let's buy ${ITEM[list[0]].a} and ${ITEM[list[1]].a}.`);
  const box = panel('🛒 The market');
  const grid = h('<div class="agrid" style="grid-template-columns:repeat(3,1fr)"></div>'); box.appendChild(grid);
  const picked = new Set();
  pickN(pool.filter(k => !list.includes(k)), 4).concat(list).sort(() => Math.random() - .5).forEach(k => {
    const b = h('<button class="abtn"></button>'); b.appendChild(icon('food', FOOD_SPR[k], 48)); b.appendChild(h(`<span class="al">${ITEM[k].en}</span>`));
    b.onclick = () => { picked.has(k) ? picked.delete(k) : picked.add(k); b.classList.toggle('sel'); sfx('ui_click_01.ogg', .3); };
    grid.appendChild(b);
  });
  const done = h('<button class="big">OK!</button>'); box.appendChild(done);
  let wrong = 0;
  while (true) {
    await wait(done);
    if (picked.size === 2 && list.every(k => picked.has(k))) break;
    wrong++; sfx('refuse.ogg', .3); setAnim('refuse', 800); talk(`No. Let's buy ${ITEM[list[0]].a} and ${ITEM[list[1]].a}.`);
  }
  talk('Thank you! Yummy!'); setAnim('cheer', 1200); sfx('task_complete.ogg', .5); await sleep(1500);
  return { good: wrong === 0, stars: 3, diary: `I bought ${ITEM[list[0]].a} and ${ITEM[list[1]].a}.` };
}

// ---------------------------------------------------------------- restaurant: What would you like?
async function restaurant() {
  const menu = ['spaghetti', 'pizza', 'hamburger', 'curry', 'sushi', 'ramen', 'salad', 'pancakes'].filter(k => ITEM[k] || k === 'pancakes');
  const want = rnd(menu.filter(k => ITEM[k]));
  const waiter = rnd(CHARS.adult);
  let eating = false;
  let wx = -20, food = null;
  view.x = view.tx = 82;
  scene('restaurant', { draw(c, t) {
    if (wx < 30) wx += .5;
    drawChar(c, waiter, wx, FEET, wx < 30 ? animCell('walk', t) : 1, true);
    const r = petRect(), cs = r.w, cell = meCell(t), acc = ACCS.find(a => a.id === shop.wearing), y = 80 - cs;
    const rr = { x: Math.round(view.x - cs / 2), y, w: cs, h: cs };
    if (acc && !acc.front) drawAcc(c, acc.id, cell, rr, false, pet.sprite);
    drawCell(c, img(charSrc(pet.sprite)), cell, cs, rr.x, rr.y, false);
    if (acc && acc.front) drawAcc(c, acc.id, cell, rr, false, pet.sprite);
    drawPic(c, 'misc/restaurant_table_01', 0, 0);
    if (eating) drawSheet(c, 'food', FOOD_SPR[want], 56, 64, 20);
    else { drawPic(c, 'misc/thought_bubble_01', 50, rr.y - 26); const [bw, bh] = picSize('misc/thought_bubble_01'); drawSheet(c, 'food', FOOD_SPR[want], 50 + bw / 2 - 10, rr.y - 26 + bh / 2 - 12, 20); }
  } });
  await sleep(900);
  talk('Hello! What would you like?', 'Waiter');
  const others = pickN(menu.filter(k => k !== want && ITEM[k]), 2);
  const wrong = await choose('💬 Answer', shuffle([want, ...others]).map(k => ({ label: `I'd like ${ITEM[k].en}, please.`, k })), o => o.k === want, { cols: 1 });
  talk('Here you are!', 'Waiter'); eating = true; setAnim('eat', 1600); sfx('eat.ogg', .5); await sleep(1700);
  talk('Yummy! Thank you!'); setAnim('cheer', 1000); await sleep(1200);
  return { good: wrong === 0, stars: 3, diary: `I ate ${ITEM[want].a} at a restaurant.` };
}

// ---------------------------------------------------------------- hospital: a simple check-up
async function doctor() {
  view.x = view.tx = 30;
  scene('clinic', { draw(c, t) { drawMe(c, t, meCell(t)); drawPic(c, 'misc/dr_sprite', 60, FEET - 36); } });
  const opt = a => a.map(t => ({ label: t, t }));
  let wrong = 0;
  talk('Hello! How are you?', 'Doctor');
  wrong += await choose('💬 Answer', shuffle(opt(["I'm fine, thank you.", "I'm ten.", 'Good night.'])), o => o.t === "I'm fine, thank you.", { cols: 1 });
  talk('Open your mouth, please.', 'Doctor');
  wrong += await choose('💬 Answer', shuffle(opt(['Ahh!', 'Thank you!', 'See you!'])), o => o.t === 'Ahh!', { cols: 1, onRight: () => setAnim('cheer', 800) });
  talk('Good! Stand up, please.', 'Doctor');
  wrong += await choose('👆 What do you do?', shuffle([{ label: 'Stand up', t: 'up' }, { label: 'Sit down', t: 'sit' }, { label: 'Go to sleep', t: 'sleep' }]), o => o.t === 'up', { cols: 1 });
  view.jump = 0; await hop(1, 4);
  talk("You're healthy! Here's a sticker.", 'Doctor');
  wrong += await choose('💬 Answer', shuffle(opt(['Thank you!', 'Nice to meet you.', 'Ahh!'])), o => o.t === 'Thank you!', { cols: 1 });
  burst('star', 3); await sleep(1000);
  return { good: wrong === 0, stars: 3, diary: 'I went to the hospital. I am healthy!' };
}

// ---------------------------------------------------------------- mall: a birthday present for a friend
async function buyPresent() {
  const known = Object.keys(world.friends), fname = known.length ? rnd(known) : rnd(FRIEND_NAMES);
  const toy = rnd(TOYS), others = pickN(TOYS.filter(x => x.id !== toy.id), 2);
  view.x = view.tx = 36;
  scene('mall', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t)); drawPic(c, 'misc/gift', view.x + 10, FEET - 24); } });
  talk(`It's ${fname}'s birthday! ${fname} likes ${toy.en === 'cube' ? 'cubes' : toy.en + 's'}. Let's buy a present!`);
  const wrong = await choose('🎁 Which one?', shuffle([toy, ...others]).map(x => ({ label: x.en, icon: icon('item', x.spr, 56), id: x.id })), o => o.id === toy.id, { cols: 3 });
  talk(`Happy birthday, ${fname}!`); setAnim('cheer', 1500); confetti(); sfx('birthday_song_01.ogg', .4); await sleep(1800);
  return { good: wrong === 0, stars: 3, diary: `I bought a present for ${fname}.` };
}

// ================================================================ SCHOOL (classes raise skills: talking, thinking, sports)
function addSkill(k) { pet.skills = pet.skills || { talk: 0, think: 0, sport: 0 }; pet.skills[k]++; save(); toast(`📚 ${({ talk: 'Talking', think: 'Thinking', sport: 'Sports' })[k]} skill up!`); }
function schoolScene(extra) {
  const teacher = 'misc/dr_sprite';
  scene('classroom', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip); extra && extra(c, t); } });
}
const FEELINGS = [
  { en: 'happy', anim: 'cheer' }, { en: 'sad', anim: 'sad' }, { en: 'angry', anim: 'angry' },
  { en: 'sleepy', anim: 'sleep' }, { en: 'surprised', anim: 'shocked' },
];
async function classFeelings() {
  view.x = view.tx = 48; let face = null;
  schoolScene();
  let wrong = 0;
  for (const f of pickN(FEELINGS, 3)) {
    setAnim(f.anim, 99999);
    talk('How are you?', 'Teacher');
    wrong += await choose('😊 English class', shuffle([f, ...pickN(FEELINGS.filter(x => x !== f), 2)]).map(x => ({ label: `I'm ${x.en}.`, en: x.en })), o => o.en === f.en, { cols: 1 });
    setAnim('idle', 1); await sleep(400);
  }
  talk('Very good!', 'Teacher'); setAnim('cheer', 1200); await sleep(1300);
  addSkill('talk');
  return { good: wrong === 0, stars: 3, diary: 'I studied English at school.' };
}
async function classCups() {
  view.x = view.tx = 82; const X = [28, 46, 64]; let cups = [0, 1, 2], ball = Math.floor(Math.random() * 3), show = true, anim = null;
  schoolScene((c, t) => {
    cups.forEach((slot, i) => {
      let x = X[slot]; if (anim) { const k = Math.min(1, (t - anim.t0) / 400); if (anim.a === i) x = X[anim.from] + (X[anim.to] - X[anim.from]) * k; if (anim.b === i) x = X[anim.to] + (X[anim.from] - X[anim.to]) * k; }
      if (i === ball && show) drawSheet(c, 'item', 4, x - 6, 46, 12);
      drawPic(c, 'misc/pot_01', x - 8, show && i === ball ? 30 : 42);
    });
  });
  view.x = view.tx = 82;
  panel('🤔 Thinking class', '<div class="ahelp">👀 Watch the ball!</div>');
  talk('Look! The ball is here.', 'Teacher'); await sleep(1600); show = false;
  for (let k = 0; k < 4; k++) {
    const a = Math.floor(Math.random() * 3); let b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
    const ia = cups.indexOf(a), ib = cups.indexOf(b);
    anim = { a: ia, b: ib, from: a, to: b, t0: performance.now() }; sfx('swoosh_01.ogg', .3); await sleep(450);
    cups[ia] = b; cups[ib] = a; anim = null; await sleep(150);
  }
  talk('Where is the ball?', 'Teacher');
  const where = ['on the left', 'in the middle', 'on the right'];
  const wrong = await choose('🤔 Thinking class', where.map((w, i) => ({ label: `It's ${w}.`, i })), o => o.i === cups[ball], { cols: 1, onRight: () => { show = true; } });
  show = true; talk('Yes! Good job!', 'Teacher'); setAnim('cheer', 1200); await sleep(1400);
  addSkill('think');
  return { good: wrong === 0, stars: 3, diary: 'I played a thinking game at school.' };
}
async function classJump() {
  const n = 3 + Math.floor(Math.random() * 5); let jumps = 0, rope = 0;
  view.x = view.tx = 48;
  scene('gym', { draw(c, t) {
    drawMe(c, t, meCell(t));
    const im = img('assets/misc/jumping_rope_01.png'); if (im.complete) c.drawImage(im, (rope % 4) * 96, 0, 96, 96, 0, FEET - 96 + 8, 96, 96);
  } });
  talk(`P.E. time! Jump ${NUM_WORDS[n]} times!`, 'Teacher');
  const box = panel('🏃 P.E. class');
  const cnt = h('<div class="ascore">0</div>'), jb = h('<button class="big">Jump!</button>'), sb = h('<button class="abtn txt">Stop!</button>');
  box.append(cnt, jb, sb);
  jb.onclick = async () => { jumps++; cnt.textContent = jumps; rope++; sfx('jump.ogg', .3); hop(1, 6); };
  await wait(sb);
  const ok = jumps === n;
  talk(ok ? `Yes! ${NUM_WORDS[n].charAt(0).toUpperCase() + NUM_WORDS[n].slice(1)} times! Great!` : `Oops! That's ${jumps}. ${NUM_WORDS[n].charAt(0).toUpperCase() + NUM_WORDS[n].slice(1)} times next time!`, 'Teacher');
  setAnim(ok ? 'cheer' : 'refuse', 1200); await sleep(1600);
  addSkill('sport');
  return { good: ok, stars: 3, diary: 'I jumped rope at school.' };
}

// ================================================================ MORE MINI-GAMES (original games, English versions)
// flags game (original flagsGame): Right flag up! Left flag down!
async function gameFlags() {
  let L = 0, R = 0, wins = 0; // 0 down, 1 up
  view.x = view.tx = 48;
  scene('grass', { draw(c, t) {
    drawMe(c, t, meCell(t));
    const fl = img('assets/misc/flag_01.png'); if (!fl.complete) return;
    const r = petRect();
    // two flags (original flag art), held at the pet's sides: up = raised, down = lowered
    [['L', -1], ['R', 1]].forEach(([side, d]) => {
      const up = side === 'L' ? L : R; c.save();
      c.translate(view.x + d * (r.w / 2 - 3), r.y + r.h * .7);
      c.rotate(d * (up ? 0.2 : Math.PI - 0.6));
      c.scale(d < 0 ? -1 : 1, 1);
      c.drawImage(fl, -3, -28, 28, 29); c.restore();
    });
  } });
  const CMDS = [['Left flag up!', 1, null], ['Left flag down!', 0, null], ['Right flag up!', null, 1], ['Right flag down!', null, 0], ['Both flags up!', 1, 1], ['Both flags down!', 0, 0]];
  const rounds = 5;
  for (let k = 0; k < rounds; k++) {
    let cmd; do { cmd = rnd(CMDS); } while ((cmd[1] === null || cmd[1] === L) && (cmd[2] === null || cmd[2] === R));
    talk(cmd[0]);
    const box = panel(`🚩 Flag game &nbsp;${k + 1}/${rounds}`, '<div class="ahelp">Move the flags!</div>');
    const grid = h('<div class="agrid" style="grid-template-columns:repeat(2,1fr)"></div>'); box.appendChild(grid);
    let nl = L, nr = R;
    [['Left flag up', 'L', 1], ['Right flag up', 'R', 1], ['Left flag down', 'L', 0], ['Right flag down', 'R', 0]].forEach(([lb, s, v]) => {
      const b = h(`<button class="abtn txt">${lb}</button>`); b.onclick = () => { if (s === 'L') L = v; else R = v; sfx('ui_click_01.ogg', .3); }; grid.appendChild(b);
    });
    const ok = h('<button class="big">OK!</button>'); box.appendChild(ok);
    await wait(ok);
    const good = (cmd[1] === null || cmd[1] === L) && (cmd[2] === null || cmd[2] === R) && (cmd[1] !== null || L === nl) && (cmd[2] !== null || R === nr);
    if (good) { wins++; setAnim('cheer', 800); sfx('cheer.ogg', .4); talk('Good!'); } else { setAnim('refuse', 800); sfx('refuse.ogg', .3); talk(`Oops! "${cmd[0]}"`); }
    await sleep(1100);
  }
  return gameEnd(wins >= 4, `You got ${wins} of ${rounds}!`, 'I played the flag game.');
}
// food quiz (original foodKnowledgeGame): What is this?
async function gameFoodQuiz() {
  const keys = Object.keys(FOOD_SPR).filter(k => ITEM[k]); let wins = 0, cur = null;
  view.x = view.tx = 26;
  scene('grass', { draw(c, t) { drawMe(c, t, meCell(t)); if (cur) drawSheet(c, 'food', FOOD_SPR[cur], 52, 30, 36); } });
  for (let k = 0; k < 3; k++) {
    cur = rnd(keys); talk('What is this?');
    const w = await choose(`🍽️ Food quiz &nbsp;${k + 1}/3`, shuffle([cur, ...pickN(keys.filter(x => x !== cur), 2)]).map(x => ({ label: `It's ${ITEM[x].a}.`, x })), o => o.x === cur, { cols: 1 });
    if (!w) wins++; setAnim('cheer', 700); await sleep(500);
  }
  cur = null;
  return gameEnd(wins >= 2, `You got ${wins} of 3!`, 'I played a food quiz.');
}
// memory (original plantMatchingGame): remember the vegetables in order
async function gameMemory() {
  const seq = pickN(CROPS, 3); let showing = -1;
  view.x = view.tx = 20;
  scene('arcade', { draw(c, t) { drawMe(c, t, meCell(t)); if (showing >= 0) drawSheet(c, 'plant', seq[showing].spr + 2, 44, 26, 40); } });
  talk('Watch! Remember them!');
  panel('🧠 Memory game', '<div class="ahelp">👀 Watch…</div>');
  await sleep(800);
  for (let i = 0; i < 3; i++) { showing = i; talk(`A ${seq[i].one}!`); sfx('pop_01.mp3', .3); await sleep(1300); showing = -1; await sleep(250); }
  talk('What did you see? Tap them in order!');
  const box = panel('🧠 Memory game');
  const grid = h('<div class="agrid" style="grid-template-columns:repeat(3,1fr)"></div>'); box.appendChild(grid);
  let i = 0, ok = true;
  await new Promise(res => shuffle([...seq, ...pickN(CROPS.filter(c => !seq.includes(c)), 3)]).forEach(cr => {
    const b = h('<button class="abtn"></button>'); b.appendChild(icon('plant', cr.spr + 2, 48)); b.appendChild(h(`<span class="al">${cr.pl}</span>`));
    b.onclick = () => { if (b.disabled) return; if (cr === seq[i]) { b.classList.add('right'); b.disabled = true; i++; sfx('pop_01.mp3', .3); if (i === 3) res(); } else { ok = false; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); sfx('refuse.ogg', .3); } };
    grid.appendChild(b);
  }));
  return gameEnd(ok, ok ? 'You remembered them all!' : 'You did it!', 'I played a memory game.');
}
// number puzzle (original imagePuzzleGame tiles): Tap seven!
async function gameTiles() {
  const order = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]); let done = new Set(), wins = 0;
  view.x = view.tx = 84;
  const cells = order.map((n, i) => ({ n, x: 4 + (i % 3) * 21, y: 14 + Math.floor(i / 3) * 21 }));
  let target = 0;
  const run = () => new Promise(res => scene('arcade2', {
    draw(c, t) {
      drawMe(c, t, meCell(t));
      const im = img('assets/misc/image_puzzle_01.png'); if (!im.complete) return;
      cells.forEach(cl => { if (done.has(cl.n)) return; const i = cl.n - 1; c.drawImage(im, (i % 3) * 32, Math.floor(i / 3) * 32, 32, 32, cl.x, cl.y, 20, 20); });
    },
    tap(x, y) { const cl = cells.find(cl => !done.has(cl.n) && x >= cl.x && x < cl.x + 20 && y >= cl.y && y < cl.y + 20); if (cl) res(cl.n); },
  }));
  for (let k = 0; k < 4; k++) {
    do { target = 2 + Math.floor(Math.random() * 8); } while (done.has(target));
    talk(`Tap ${NUM_WORDS[target]}!`);
    panel(`🔢 Number tiles &nbsp;${k + 1}/4`, '<div class="ahelp">👆 Tap the tile on the screen</div>');
    let first = true;
    while (true) { const n = await run(); if (n === target) { done.add(n); sfx('pop_01.mp3', .4); setAnim('cheer', 600); if (first) wins++; break; } first = false; sfx('refuse.ogg', .3); setAnim('refuse', 600); talk(`That's ${NUM_WORDS[n]}. Tap ${NUM_WORDS[target]}!`); }
  }
  return gameEnd(wins >= 3, `You got ${wins} of 4!`, 'I played a number game.');
}

// ================================================================ COOKING (original cooking pot)
const RECIPES = [
  { en: 'curry and rice', dish: 'curry', need: ['carrot', 'potato', 'meat'] },
  { en: 'salad', dish: 'salad', need: ['tomato', 'cabbage'] },
  { en: 'vegetable soup', dish: null, dishSpr: 463, need: ['carrot', 'potato', 'tomato'] },
];
const INGR = { carrot: ['plant', 43, 'a carrot'], potato: ['plant', 47, 'a potato'], tomato: ['plant', 35, 'a tomato'], cabbage: ['plant', 31, 'a cabbage'], meat: ['food', 689, 'meat'], banana: ['food', 960, 'a banana'], milk: ['food', 1036, 'milk'], peach: ['plant', 59, 'a peach'] };
async function cooking() {
  const r = rnd(RECIPES); let inPot = [], stage = 1, done = false;
  scene('kitchen', { draw(c, t) {
    drawPic(c, 'misc/cooking_pot_p01', 0, 0);
    if (inPot.length) { c.save(); c.globalAlpha = Math.min(1, inPot.length / r.need.length); drawPic(c, 'misc/cooking_pot_p02', 0, 0); c.restore(); }
    inPot.forEach((k, i) => { const [sh, n] = INGR[k]; const a = t / 900 + i * 2.1; drawSheet(c, sh, n, 38 + Math.cos(a) * 14, 38 + Math.sin(a) * 12, 18); });
    drawPic(c, 'misc/cooking_pot_p03', 0, 0);
    if (done) drawSheet(c, 'food', r.dish ? FOOD_SPR[r.dish] : r.dishSpr, 30, 30, 36);
  } });
  const say = `Let's make ${r.en}! Put in ${r.need.map(k => INGR[k][2]).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
  talk(say);
  const box = panel('🍳 Let\'s cook!');
  const grid = h('<div class="agrid" style="grid-template-columns:repeat(4,1fr)"></div>'); box.appendChild(grid);
  let wrong = 0;
  await new Promise(res => shuffle(Object.keys(INGR)).forEach(k => {
    const [sh, n, a] = INGR[k];
    const b = h('<button class="abtn"></button>'); b.appendChild(icon(sh, n, 44)); b.appendChild(h(`<span class="al">${a.replace(/^an? /, '')}</span>`));
    b.onclick = () => {
      if (b.disabled) return;
      if (r.need.includes(k) && !inPot.includes(k)) { inPot.push(k); b.disabled = true; b.classList.add('right'); sfx('pop_01.mp3', .4); stage = Math.min(3, 1 + inPot.length); if (inPot.length === r.need.length) res(); }
      else { wrong++; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); sfx('refuse.ogg', .3); setAnim('refuse', 600); talk(`No! ${say}`); }
    };
    grid.appendChild(b);
  }));
  inPot = []; done = true; setAnim('cheer', 1500); sfx('cheer_success.ogg', .5); talk(`We made ${r.en}! Yummy!`); burst('heart', 4); await sleep(1800);
  return { good: wrong === 0, stars: 3, diary: `I made ${r.en}.` };
}

// ================================================================ THE SEA (original island / sea vacation): find things on the beach
async function seaTrip() {
  const things = pickN(TOYS, 4), want = pickN(things, 2); const found = new Set();
  const spots = things.map((t, i) => ({ t, x: 14 + i * 22 + Math.random() * 6, y: 64 + Math.random() * 14 }));
  view.x = view.tx = 48;
  talk(`We're at the sea! Find the ${want[0].en} and the ${want[1].en}!`);
  panel('🏖️ The sea', '<div class="ahelp">👆 Tap them on the screen</div>');
  let wrong = 0;
  await new Promise(res => scene('beach', {
    draw(c, t) { spots.forEach(s => { if (!found.has(s.t.id)) drawSheet(c, 'item', s.t.spr, s.x - 6, s.y - 6, 12); }); stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip); },
    tap(x, y) {
      const s = spots.find(s => !found.has(s.t.id) && Math.hypot(s.x - x, s.y - y) < 9); if (!s) return;
      view.tx = s.x;
      if (want.includes(s.t)) { found.add(s.t.id); sfx('pop_01.mp3', .4); setAnim('cheer', 600); if (want.every(w => found.has(w.id))) res(); }
      else { wrong++; sfx('refuse.ogg', .3); setAnim('refuse', 600); talk(`That's a ${s.t.en}. Find the ${want.filter(w => !found.has(w.id)).map(w => w.en).join(' and the ')}!`); }
    },
  }));
  talk('We found them! The sea is fun!'); setAnim('cheer', 1500); await sleep(1600);
  return { good: wrong === 0, stars: 3, diary: 'I went to the sea.' };
}

// ================================================================ ANIMALS (original cats and dogs)
const ANIMAL_NAMES = { dog: ['Pochi', 'Hachi', 'Shiro', 'Coco'], cat: ['Tama', 'Mike', 'Kuro', 'Momo'] };
const pal = { x: 70, tx: 70, next: 0, flip: false };
function drawAnimal(c, t, x, feet, cellNo, flip) {
  const a = world.animal; if (!a) return;
  const im = img(`assets/animal/${a.sprite}.png`); if (!im.complete || !im.naturalWidth) return;
  drawCell(c, im, cellNo, 16, Math.round(x - 8), Math.round(feet - 16), flip);
}
function drawAnimalAtHome(c, t) {
  if (!world.animal) return;
  if (t > pal.next && Math.abs(pal.tx - pal.x) < .5) { pal.tx = 10 + Math.random() * 76; pal.next = t + 3000 + Math.random() * 4000; }
  const moving = Math.abs(pal.tx - pal.x) > .4;
  if (moving) { pal.flip = pal.tx > pal.x; pal.x += Math.sign(pal.tx - pal.x) * .18; }
  drawAnimal(c, t, pal.x, FEET + 2, moving ? animCell('walk', t) : (Math.floor(t / 4000) % 3 === 2 ? 14 : 1), moving && pal.flip);
}
async function adoptAnimal() {
  const type = Math.random() < .5 ? 'dog' : 'cat', sprite = `${type}_0${1 + Math.floor(Math.random() * 4)}`;
  let ax = 110;
  view.x = view.tx = 30;
  world.animal = { type, sprite, name: '' };
  scene(shop.room || 'home_03', { draw(c, t) { if (ax > 64) ax -= .4; drawMe(c, t, meCell(t)); drawAnimal(c, t, ax, FEET, ax > 64 ? animCell('walk', t) : 1, false); } });
  talk(`Look! A little ${type}! Can we keep it?`);
  let wrong = await choose('💬 Answer', [{ label: 'Yes! Let\'s keep it!', y: 1 }], o => o.y, { cols: 1 });
  talk(`What's its name?`);
  const names = ANIMAL_NAMES[type];
  await choose('🐾 Choose a name', names.map(n => ({ label: n, n })), o => (world.animal.name = o.n), { cols: 2 });
  talk(`Hello, ${world.animal.name}! Welcome to my house!`); setAnim('cheer', 1500); burst('heart', 5); sfx('cute.ogg', .5);
  saveWorld(); count('animals'); await sleep(1800);
  return { good: wrong === 0, stars: 3, diary: `I got a ${type}! Its name is ${world.animal.name}.` };
}
async function feedAnimal() {
  const a = world.animal; let ate = false;
  view.x = view.tx = 26;
  scene(shop.room || 'home_03', { draw(c, t) { drawMe(c, t, meCell(t)); if (ate) drawPic(c, 'misc/pet_bowl_01', 52, FEET - 14); drawAnimal(c, t, 70, FEET, ate ? animCell('eat', t) : animCell('sad', t), false); } });
  talk(`${a.name} is hungry. Give ${a.name} food!`);
  const opts = [{ label: 'dog food', icon: picIcon('misc/pet_bowl_01', 56), k: 'bowl' }, { label: 'a ball', icon: icon('item', 4, 56), k: 'ball' }, { label: 'a toothbrush', icon: picIcon('misc/toothbrush_01', 56), k: 'brush' }];
  if (a.type === 'cat') opts[0].label = 'cat food';
  const wrong = await choose('🐾 What do you give?', shuffle(opts), o => o.k === 'bowl', { cols: 3 });
  ate = true; sfx('eat.ogg', .5); await sleep(1500); talk(`${a.name} is happy!`); burst('heart', 3); setAnim('cheer', 1000); await sleep(1300);
  return { good: wrong === 0, stars: 2, diary: `I gave ${a.name} food.` };
}
async function washAnimal() {
  const a = world.animal; let foam = 0, rubbed = 0, lastX = null, step = 'wash';
  view.x = view.tx = 30;
  talk(`${a.name} is dirty. Let's wash ${a.name}!`);
  const box = panel('🛁 Wash time', '<div class="ahelp">👆 Rub on the screen</div>'); const bar = h('<div class="ascore">0%</div>'); box.appendChild(bar);
  await new Promise(res => scene('dogbath', {
    draw(c, t) {
      drawMe(c, t, meCell(t));
      drawAnimal(c, t, 64, FEET, step === 'wash' ? 1 : 2, false);
      for (let i = 0; i < Math.min(8, foam); i++) drawPic(c, 'misc/foam_single', 56 + (i % 4) * 5 - 4, FEET - 18 + Math.floor(i / 4) * 5);
    },
    move(x, y) {
      if (Math.hypot(x - 64, y - (FEET - 8)) > 16) return;
      if (lastX !== null && Math.abs(x - lastX) > 2) { rubbed++; if (rubbed % 6 === 0) { foam++; sfx('pop_01.mp3', .2); } bar.textContent = Math.min(100, Math.round(rubbed / 48 * 100)) + '%'; if (rubbed >= 48) res(); }
      lastX = x;
    },
  }));
  foam = 0; step = 'clean'; talk(`${a.name} is clean now!`); burst('twinkle', 4); setAnim('cheer', 1200); sfx('cheer.ogg', .4); await sleep(1600);
  return { good: true, stars: 2, diary: `I washed ${a.name}.` };
}
async function walkDog() {
  const a = world.animal; let ax = 70, wrong = 0;
  view.x = view.tx = 30;
  scene('park', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip); drawAnimal(c, t, ax, FEET, a.pose || 1, false); } });
  const CMD = [['Sit!', 14], ['Jump!', 'jump'], ['Lie down!', 16]];
  for (const [cmd, pose] of pickN(CMD, 2)) {
    talk(`${a.name}, ${cmd.toLowerCase()}`);
    wrong += await choose(`🐾 What does ${a.name} do?`, shuffle(CMD).map(([c2, p]) => ({ label: c2.replace('!', ''), p })), o => o.p === pose, { cols: 1 });
    a.pose = pose === 'jump' ? 1 : pose; sfx('cute.ogg', .4); await sleep(1200); a.pose = 1;
  }
  delete a.pose; talk(`Good ${a.type === 'dog' ? 'dog' : 'cat'}, ${a.name}!`); burst('heart', 3); await sleep(1200);
  return { good: wrong === 0, stars: 2, diary: `I played with ${a.name} in the park.` };
}
async function animalTime() { return rnd(world.animal.type === 'dog' ? [feedAnimal, washAnimal] : [feedAnimal, washAnimal])(); }

// ================================================================ MORE JOBS (original officeWork / teacherClassroomWork / bodyBuilderWork)
async function jobTeacher() {
  const keys = Object.keys(FOOD_SPR).filter(k => ITEM[k]); let wrong = 0;
  view.x = view.tx = 16;
  const kids = pickN(CHARS.child, 2);
  scene('classroom', { draw(c, t) { drawMe(c, t, meCell(t)); drawChar(c, kids[0], 56, FEET, 1, false); drawChar(c, kids[1], 80, FEET, 1, false); } });
  for (let k = 0; k < 3; k++) {
    const x = rnd(keys);
    talk(`Teacher ${pet.name}, which one is "${ITEM[x].en}"?`, 'Student');
    wrong += await choose(`🏫 Job: teacher &nbsp;${k + 1}/3`, shuffle([x, ...pickN(keys.filter(y => y !== x), 3)]).map(y => ({ icon: icon('food', FOOD_SPR[y], 56), y })), o => o.y === x, { cols: 2 });
    talk('Thank you!', 'Student'); await sleep(700);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked as a teacher.' };
}
async function jobOffice() {
  view.x = view.tx = 51; let wrong = 0;
  scene('office', { draw(c, t) { drawMe(c, t, meCell(t)); } });
  for (let k = 0; k < 2; k++) {
    const num = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
    talk(`Please call ${num.map(n => NUM_WORDS[n]).join(' - ')}.`, 'Boss');
    const box = panel(`📞 Job: office &nbsp;${k + 1}/2`);
    const shown = h('<div class="ascore phone">_ _ _</div>'); box.appendChild(shown);
    const grid = h('<div class="agrid nums" style="grid-template-columns:repeat(5,1fr)"></div>'); box.appendChild(grid);
    let typed = [];
    await new Promise(res => [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(d => {
      const b = h(`<button class="abtn txt num">${d}</button>`);
      b.onclick = () => { if (typed.length >= 3) return; typed.push(d); shown.textContent = typed.join(' ') + ' _'.repeat(Math.max(0, 3 - typed.length)); sfx('ui_click_01.ogg', .3); if (typed.length === 3) res(); };
      grid.appendChild(b);
    }));
    if (typed.join('') === num.join('')) { talk('Hello! Thank you!', 'Phone'); setAnim('cheer', 900); }
    else { wrong++; talk(`Oops! It's ${num.join(' ')}.`, 'Boss'); setAnim('refuse', 900); }
    await sleep(1400);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked in an office.' };
}
async function jobTrainer() {
  view.x = view.tx = 26; let wrong = 0, kidJump = 0;
  const kid = rnd(CHARS.child);
  scene('gym', { draw(c, t) { drawMe(c, t, meCell(t)); drawChar(c, kid, 70, FEET - kidJump, kidJump ? 2 : 1, false); } });
  for (let k = 0; k < 2; k++) {
    const n = 2 + Math.floor(Math.random() * 6);
    talk('Count my jumps!', 'Student'); panel(`💪 Job: gym coach &nbsp;${k + 1}/2`, '<div class="ahelp">👀 Count…</div>');
    await sleep(700);
    for (let i = 0; i < n; i++) { for (let f = 0; f <= 8; f++) { kidJump = Math.sin(f / 8 * Math.PI) * 8; await sleep(28); } kidJump = 0; sfx('jump.ogg', .3); await sleep(220); }
    talk('How many?', 'Student');
    wrong += await choose(`💪 Job: gym coach &nbsp;${k + 1}/2`, shuffle([n, n + 1, n - 1]).map(v => ({ label: NUM_WORDS[v], v })), o => o.v === n, { cols: 1 });
    talk(`Yes! ${NUM_WORDS[n].charAt(0).toUpperCase() + NUM_WORDS[n].slice(1)}!`, 'Student'); await sleep(800);
  }
  count('jobs');
  return { good: wrong === 0, stars: 6, diary: 'I worked at a gym.' };
}

// ================================================================ GARDEN: dig for treasure (original digGardenTreasure)
async function digTreasure() {
  const X = [20, 48, 76], at = Math.floor(Math.random() * 3), words = ['on the left', 'in the middle', 'on the right'];
  let dug = -1;
  view.x = view.tx = 48;
  scene('garden', { draw(c, t) {
    X.forEach((x, i) => { const im = img('assets/misc/dig_spot_01.png'); if (im.complete) c.drawImage(im, i === dug ? 24 : 0, 0, 24, 24, x - 12, 70, 24, 24); });
    if (dug === at) { const im = img('assets/misc/treasure_chest_01.png'); if (im.complete) c.drawImage(im, 27, 0, 27, 27, X[at] - 13, 52, 27, 27); }
    stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip);
  } });
  talk(`Let's dig! I think the treasure is ${words[at]}.`);
  const wrong = await choose('⛏️ Where do you dig?', words.map((w, i) => ({ label: w, i })), o => o.i === at, { cols: 1, onWrong: o => { dug = o.i; } });
  dug = at; view.tx = X[at] + (at === 2 ? -16 : 16); sfx('cheer_success.ogg', .5); setAnim('cheer', 1500); talk('Treasure! Wow!'); burst('star', 4); await sleep(1700);
  return { good: wrong === 0, stars: 5, diary: 'I found treasure in the garden!' };
}

// ================================================================ HOLIDAY EXTRAS: Santa (original encounterSanta) and trick-or-treat
async function santaVisit() {
  let sx = 110;
  view.x = view.tx = 30;
  scene(shop.room || 'home_03', { draw(c, t) { drawDecor(c, t); drawMe(c, t, meCell(t)); if (sx > 68) sx -= .5; const im = img('assets/misc/santa_01.png'); if (im.complete) drawCell(c, im, sx > 68 ? animCell('walk', t) : animCell('cheer', t), 32, sx - 16, FEET - 32, false); } });
  await sleep(1400);
  talk('Ho ho ho! Merry Christmas!', 'Santa');
  let wrong = await choose('💬 Answer', shuffle(['Merry Christmas!', 'Happy New Year!', 'Trick or treat!']).map(t => ({ label: t, t })), o => o.t === 'Merry Christmas!', { cols: 1 });
  talk('What do you want for Christmas?', 'Santa');
  const toy = rnd(TOYS);
  wrong += await choose('🎁 Answer', shuffle([toy, ...pickN(TOYS.filter(x => x !== toy), 2)]).map(x => ({ label: `I want a ${x.en}.`, icon: icon('item', x.spr, 44), x })), o => true, { cols: 1, onRight: o => { if (!world.toys.includes(o.x.id)) world.toys.push(o.x.id); } });
  talk('Here you are! Merry Christmas!', 'Santa'); confetti(); setAnim('cheer', 1500); sfx('cheer_success.ogg', .5); saveWorld(); await sleep(1800);
  return { good: wrong === 0, stars: 5, diary: 'Santa came to my house!' };
}
async function trickOrTreat() {
  view.x = view.tx = 30; let neighbor = null, candy = 0, wrong = 0;
  scene('street', { draw(c, t) { drawPic(c, 'misc/building_home', 0, -4); drawPic(c, 'bg/street_decor', 0, 0); drawMe(c, t, meCell(t)); if (neighbor) drawChar(c, neighbor, 68, FEET, 1, false); for (let i = 0; i < candy; i++) drawSheet(c, 'food', 1033, 4 + i * 10, 4, 10); } });
  for (let k = 0; k < 2; k++) {
    talk('Knock, knock!'); neighbor = rnd([...CHARS.adult]); sfx('pop_01.mp3', .4); await sleep(900);
    talk('Hello!', 'Neighbor');
    wrong += await choose('🎃 What do you say?', shuffle(['Trick or treat!', 'Good night!', 'Merry Christmas!']).map(t => ({ label: t, t })), o => o.t === 'Trick or treat!', { cols: 1 });
    talk('Here you are! Happy Halloween!', 'Neighbor'); candy++; setAnim('cheer', 900); sfx('task_complete.ogg', .4); await sleep(1300); neighbor = null;
  }
  return { good: wrong === 0, stars: 4, diary: 'I went trick-or-treating. I got candy!' };
}
// Christmas uses Santa, Halloween uses trick-or-treat, other holidays use the greeting
const _holiday = holiday;
holiday = async function () {
  const ev = eventToday();
  if (ev && ev.id === 'christmas') { const key = 'santa' + new Date().getFullYear(); if (!world.events[key]) { const r = await _holiday(); world.events[key] = true; saveWorld(); return r; } return santaVisit(); }
  if (ev && ev.id === 'halloween') { const key = ev.id + new Date().getFullYear(); if (world.events[key]) return trickOrTreat(); }
  return _holiday();
};

// ================================================================ FURNITURE (original furniture, shown in the room)
const FURNITURE = [
  { id: 'plant_01', en: 'Plant', price: 25 }, { id: 'fan', en: 'Fan', price: 25 }, { id: 'pink_pillow', en: 'Pillow', price: 30 },
  { id: 'tv_01', en: 'TV', price: 40 }, { id: 'chair_orange', en: 'Orange chair', price: 40 }, { id: 'cabinet_01', en: 'Drawers', price: 45 },
  { id: 'lamp_sun', en: 'Sun lamp', price: 50 }, { id: 'doll_girl', en: 'Doll', price: 50 }, { id: 'city_toy_car', en: 'Toy car', price: 50 },
  { id: 'race_car_minibed', en: 'Car bed', price: 60 }, { id: 'arcade_machine', en: 'Game machine', price: 80 }, { id: 'sofa_blue', en: 'Blue sofa', price: 90 },
  { id: 'sofa_peachy', en: 'Peach sofa', price: 90 }, { id: 'bookcase_wooden', en: 'Bookcase', price: 70 },
];
const SLOTS = [2, 34, 64]; // three places on the floor
function drawFurniture(c) {
  if (!FURNISHABLE.includes(shop.room || 'home_03')) return;
  (shop.furn || []).forEach((id, i) => { if (!id) return; const [w, hh] = picSize('furn/' + id); drawPic(c, 'furn/' + id, Math.min(96 - w, SLOTS[i]), FEET - hh + 2); });
}
const _drawDecor = drawDecor;
drawDecor = function (c, t) { drawFurniture(c); _drawDecor(c, t); drawAnimalAtHome(c, t); };

// shop tab for furniture
(function addFurnitureTab() {
  const tabs = document.querySelector('#shop .tabs');
  tabs.appendChild(h('<button data-tab="furn">🛋️ Furniture</button>'));
  tabs.lastChild.onclick = () => { shopTab = 'furn'; renderShop(); };
  const orig = renderShop;
  renderShop = function () {
    if (shopTab !== 'furn') return orig();
    $('shopStars').textContent = shop.stars;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'furn'));
    shop.furnOwned = shop.furnOwned || []; shop.furn = shop.furn || [null, null, null];
    const g = $('shopGrid'); g.innerHTML = '';
    g.appendChild(h(`<div class="slotHelp">Tap a thing you have to put it in your room (3 places).${FURNISHABLE.includes(shop.room || 'home_03') ? '' : ' ⚠️ This room can\'t have furniture. Use the Peach, Blue, Pastel, Pink, Wood or Night room.'}</div>`));
    for (const it of FURNITURE) {
      const owned = shop.furnOwned.includes(it.id), on = shop.furn.includes(it.id);
      const d = h(`<button class="sitem${owned ? ' owned' : ''}${on ? ' on' : ''}${!owned && shop.stars < it.price ? ' cant' : ''}"></button>`);
      const t = picIcon('furn/' + it.id, 72); t.style.maxWidth = '96px'; t.style.objectFit = 'contain'; d.appendChild(h('<div class="fthumb"></div>')); d.firstChild.appendChild(t);
      d.insertAdjacentHTML('beforeend', `<div>${it.en}</div><div class="price">${on ? '✔ ON' : owned ? 'Put in room' : '⭐ ' + it.price}</div>`);
      d.onclick = () => {
        if (!owned) { if (shop.stars < it.price) { sfx('refuse.ogg', .4); return; } shop.stars -= it.price; shop.furnOwned.push(it.id); count('bought'); sfx('task_complete.ogg'); }
        if (on) shop.furn[shop.furn.indexOf(it.id)] = null;
        else { const free = shop.furn.indexOf(null); if (free >= 0) shop.furn[free] = it.id; else { shop.furn.shift(); shop.furn.push(it.id); } }
        store(SHOP_KEY, shop); updateTop(); renderShop(); if (!place) homeBg();
      };
      g.appendChild(d);
    }
  };
})();

// ================================================================ TODAY'S GOALS (like the original's daily missions)
const GOALS = [
  { id: 'wish3', en: 'Get 3 wishes right the first time', key: 'firstTry', goal: 3 },
  { id: 'wish5', en: 'Do 5 wishes', key: 'wishes', goal: 5 },
  { id: 'game1', en: 'Play a game', key: 'gamesPlayed', goal: 1 },
  { id: 'out1', en: 'Go out in the town', key: 'outings', goal: 1 },
  { id: 'friend1', en: 'Talk with a friend', key: 'friendVisits', goal: 1 },
  { id: 'letter1', en: 'Read a letter', key: 'letters', goal: 1 },
];
function todayGoals() {
  const d = dayKey();
  if (!world.goals || world.goals.d !== d) { world.goals = { d, list: pickN(GOALS, 3).map(g => ({ id: g.id, n: 0, done: false })) }; saveWorld(); }
  return world.goals;
}
function goalStep(key, n = 1) {
  const g = todayGoals();
  g.list.forEach(x => { const def = GOALS.find(y => y.id === x.id); if (def.key !== key || x.done) return; x.n += n; if (x.n >= def.goal) { x.done = true; shop.stars += 5; store(SHOP_KEY, shop); toast(`✅ Goal done: ${def.en}! +5 ⭐`); updateTop(); } });
  saveWorld(); updateProfile();
}
const _count = count;
count = function (key, n = 1) { _count(key, n); if (['outings', 'letters'].includes(key)) goalStep(key, n); };
const _noteWish = noteWish;
noteWish = function (firstTry) { _noteWish(firstTry); goalStep('wishes'); if (firstTry) goalStep('firstTry'); };

// game & friend counters for goals
const _gameEnd = gameEnd;
gameEnd = function (...a) { goalStep('gamesPlayed'); return _gameEnd(...a); };
const _visitFriend = visitFriend;
visitFriend = async function () { const r = await _visitFriend(); goalStep('friendVisits'); return r; };

// show goals and skills on the profile card
const _updateProfile = updateProfile;
updateProfile = function () {
  _updateProfile();
  if (!pet || pet.stage === 0 || !pet.name || !$('profile').querySelector('.prow')) return;
  const g = todayGoals(), done = g.list.filter(x => x.done).length;
  const sk = pet.skills || { talk: 0, think: 0, sport: 0 };
  const stars = v => '★'.repeat(Math.min(5, Math.floor(v / 2) + (v ? 1 : 0))) || '–';
  $('profile').insertAdjacentHTML('beforeend', `<div class="prow"><span>Today's goals</span><span>✅ ${done} / 3</span></div>
    <div class="prow"><span>Skills</span><span>🗣️${sk.talk} 🧠${sk.think} 🏃${sk.sport}</span></div>`);
};
// goals tab in the book
(function addGoalsTab() {
  const tabs = $('diaryTabs');
  tabs.insertBefore(h('<button data-tab="goals">✅ Today</button>'), tabs.firstChild);
  tabs.firstChild.onclick = () => { diaryTab = 'goals'; renderDiary(); };
  const orig = renderDiary;
  renderDiary = function () {
    if (diaryTab !== 'goals') return orig();
    document.querySelectorAll('#diaryTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'goals'));
    const g = todayGoals();
    $('diaryList').innerHTML = '<div class="goals">' + g.list.map(x => { const def = GOALS.find(y => y.id === x.id); return `<div class="goal ${x.done ? 'got' : ''}"><span>${x.done ? '✅' : '⬜'}</span><b>${def.en}</b><i>${Math.min(x.n, def.goal)} / ${def.goal}</i></div>`; }).join('') + '<p class="ahelp">Each goal: +5 ⭐</p></div>';
  };
})();

// ================================================================ register the new activities (they replace wishes; each limited per day)
ACTIVITIES.push(
  { id: 'town', min: 2, cap: 2, w: 3, intro: () => "Let's go out!", run: goOut },
  { id: 'cook', min: 2, cap: 1, w: 1.2, intro: () => "Let's cook!", run: cooking },
  { id: 'sea', min: 3, cap: 1, w: .8, intro: () => "Let's go to the sea!", run: seaTrip },
  { id: 'adopt', min: 2, cap: 1, w: 1.5, ok: () => !world.animal, intro: () => 'Look outside! Who is that?', run: adoptAnimal },
  { id: 'animal', min: 2, cap: 1, w: 1.5, ok: () => !!world.animal, intro: () => `Let's take care of ${world.animal.name}!`, run: animalTime },
  { id: 'dig', min: 2, cap: 1, w: .8, intro: () => "Let's dig in the garden!", run: digTreasure },
);
// more mini-games and jobs in the existing lists
(function extend() {
  const g = ACTIVITIES.find(a => a.id === 'game'); g.run = () => rnd([gameCatch, gameNumber, gameSimon, gameSpell, gameFlags, gameFoodQuiz, gameMemory, gameTiles])();
  const j = ACTIVITIES.find(a => a.id === 'job'); j.run = () => rnd([jobShop, jobMail, jobTeacher, jobOffice, jobTrainer])();
})();

// activities registered before these wrappers existed must use the new versions
ACTIVITIES.find(a => a.id === 'holiday').run = () => holiday();
ACTIVITIES.find(a => a.id === 'friend').run = () => visitFriend();
