// ============================================================
//  Tama Talk – main game
//  Pets never get sick or die from missed care. Nothing happens
//  while the game is closed. They only reach old age after a long,
//  well-cared-for life (number of requests answered).
// ============================================================

const $ = id => document.getElementById(id);
const W = 136, H = 42, FLOOR = 31, PX = 10;
const SAVE_KEY = 'tamatalk.save.v1', SET_KEY = 'tamatalk.settings.v1', ALB_KEY = 'tamatalk.album.v1';

const SETTING_OPTS = {
  life: [['short', 'Short'], ['normal', 'Normal'], ['long', 'Long'], ['verylong', 'Very long']],
  pace: [['fast', 'Fast'], ['normal', 'Normal'], ['slow', 'Slow']],
  labels: [[false, 'Off'], [true, 'On']],
  jaHint: [[true, 'On'], [false, 'Off']],
};
const LIFE_MULT = { short: 0.5, normal: 1, long: 2, verylong: 4 };
const PACE = { fast: [900, 1800], normal: [2500, 5000], slow: [7000, 12000] };

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let settings = Object.assign({ life: 'normal', pace: 'normal', labels: false, jaHint: true }, load(SET_KEY, {}));
let pet = load(SAVE_KEY, null);
let need = null;            // current request
let busy = false;           // animation in progress
let trayCache = {};         // stable tray contents per request
let needTimer = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- scaling
function fit() {
  const s = Math.min(window.innerWidth / 1380, window.innerHeight / 612);
  $('app').style.transform = `translate(-50%, -50%) scale(${s})`;
}
window.addEventListener('resize', fit); fit();

// ---------------------------------------------------------------- canvas
const bg = $('bg').getContext('2d'), fg = $('fg').getContext('2d');
bg.imageSmoothingEnabled = fg.imageSmoothingEnabled = false;

const view = { x: 46, tx: 46, jump: 0, shake: 0, face: 'normal', faceUntil: 0, blinkAt: 0, wobble: 0, float: 0, halo: false, alpha: 1, flash: 0, walkPause: 0 };

function petSprite() { return pet && pet.stage > 0 ? SPR[pet.stage] : SPR.egg; }
function petBox() { // scene-pixel bounding box of the pet
  const m = petSprite().map, { w, h } = mapSize(m);
  const x = Math.round(view.x - w / 2), y = FLOOR + 6 - h - Math.round(view.jump) - Math.round(view.float);
  return { x, y, w, h };
}

function render(t) {
  drawRoom(bg, W, H, FLOOR, t);
  fg.clearRect(0, 0, W, H);
  if (!pet) { requestAnimationFrame(render); return; }

  // poop
  if (pet.poop && $('outing').classList.contains('hidden')) drawMap(fg, POOP, 96, FLOOR + 1, POOP_PAL);

  // movement
  if (!busy && !need && pet.stage > 0 && t > view.walkPause) {
    if (Math.abs(view.tx - view.x) < 0.5) { view.tx = 26 + Math.random() * 60; view.walkPause = t + 1500 + Math.random() * 2500; }
  }
  const speed = pet.stage === 5 ? 0.12 : 0.25;
  if (Math.abs(view.tx - view.x) > 0.3) view.x += Math.sign(view.tx - view.x) * Math.min(speed, Math.abs(view.tx - view.x));

  const spr = petSprite(), m = spr.map, { w } = mapSize(m);
  const b = petBox();
  let bob = (Math.floor(t / 450) % 2 === 0 && view.jump === 0 && pet.stage > 0) ? 1 : 0;
  if (pet.stage === 0) bob = 0;
  let sx = b.x + Math.round(Math.sin(view.shake * 1.7) * (view.shake > 0 ? 2 : 0));
  if (pet.stage === 0 && view.wobble > 0) sx += Math.round(Math.sin(t / 40) * 1.4);
  const sy = b.y + bob;

  // shadow
  fg.globalAlpha = 0.18 * view.alpha; fg.fillStyle = '#5a3a10';
  fg.beginPath(); fg.ellipse(view.x, FLOOR + 6.5, w / 2.2, 1.4, 0, 0, Math.PI * 2); fg.fill();
  fg.globalAlpha = view.alpha;

  const pal = palette(pet.color);
  if (view.flash > 0 && Math.floor(t / 90) % 2) {
    const white = { o: '#ffffff', b: '#ffffff', l: '#ffffff', d: '#fff6c0', w: '#ffffff' };
    drawMap(fg, m, sx, sy, white);
  } else {
    drawMap(fg, m, sx, sy, pal);
    if (pet.stage > 0) {
      let face = view.face;
      if (t > view.faceUntil) face = need ? (need.key === 'sad' ? 'sad' : 'normal') : 'normal';
      if ((face === 'normal') && t > view.blinkAt) { face = 'blink'; if (t > view.blinkAt + 150) view.blinkAt = t + 2000 + Math.random() * 3000; }
      if (face === 'talk' && Math.floor(t / 160) % 2) face = 'happy';
      drawFace(fg, spr, sx, sy, face, pal, pet.stage === 5);
      if (pet.stage >= 4 && pet.form) drawAccessory(fg, FORMS[pet.form].acc, spr, sx, sy, w);
      if (pet.stage === 5) drawCane(fg, sx + w + 1, sy + 8, mapSize(m).h - 8);
    } else if (pet.eggTaps > 0) { // cracks
      const ink = '#3a2a14';
      if (pet.eggTaps >= 2) { px(fg, ink, sx + 5, sy + 3); px(fg, ink, sx + 6, sy + 4); px(fg, ink, sx + 5, sy + 5); }
      if (pet.eggTaps >= 4) { px(fg, ink, sx + 4, sy + 6); px(fg, ink, sx + 3, sy + 7); px(fg, ink, sx + 7, sy + 6); px(fg, ink, sx + 8, sy + 7); }
    }
  }
  if (view.halo) { fg.strokeStyle = '#ffe14a'; fg.lineWidth = 1; fg.beginPath(); fg.ellipse(sx + w / 2, sy - 3, 5, 1.3, 0, 0, Math.PI * 2); fg.stroke(); }
  fg.globalAlpha = 1;

  if (view.shake > 0) view.shake = Math.max(0, view.shake - 0.25);
  positionWorn();
  requestAnimationFrame(render);
}

// scene px -> #scene css px
const toCss = (x, y) => ({ x: 3 + x * PX, y: 1 + y * PX });
function petCenterCss() { const b = petBox(); return toCss(b.x + b.w / 2, b.y + b.h / 2); }

// ---------------------------------------------------------------- jumping
async function hop(n = 2, h = 4) {
  for (let i = 0; i < n; i++) {
    for (let f = 0; f <= 10; f++) { view.jump = Math.sin(f / 10 * Math.PI) * h; await sleep(22); }
    view.jump = 0; await sleep(60);
  }
}
function setFace(f, ms = 1500) { view.face = f; view.faceUntil = performance.now() + ms; }

// ---------------------------------------------------------------- bubble
function tailToPet() {
  const bub = $('bubble');
  const cx = toCss(view.tx, 0).x;
  const maxRight = $('tray').classList.contains('hidden') ? 1346 : 740;
  bub.style.maxWidth = Math.min(900, maxRight - 20) + 'px';
  const left = Math.max(20, Math.min(maxRight - bub.offsetWidth, cx - bub.offsetWidth * 0.3));
  bub.style.left = left + 'px';
  bub.style.setProperty('--tail', Math.max(26, Math.min(bub.offsetWidth - 60, cx - left - 14)) + 'px');
}
function showBubble(text, { reply = false, ja = '' } = {}) {
  const bub = $('bubble'), t = $('bubbleText');
  bub.classList.remove('hidden', 'pop'); void bub.offsetWidth; bub.classList.add('pop');
  t.classList.toggle('reply', reply);
  t.textContent = text;
  $('bubbleJa').textContent = ja; $('bubbleJa').classList.toggle('hidden', !ja);
  $('bubbleBtns').classList.toggle('hidden', reply);
  tailToPet();
}
function hideBubble() { $('bubble').classList.add('hidden'); }
function showNeedBubble() {
  if (!need) return;
  const ja = need.hinted && settings.jaHint ? need.ja : '';
  showBubble(need.en, { ja });
  $('hintBtn').classList.toggle('off', need.tries < 1 && !need.hinted);
}
async function say(text, ms = 1800, face = 'talk') {
  showBubble(text, { reply: true }); setFace(face, ms); await sleep(ms);
}

// ---------------------------------------------------------------- UI: top + categories
function stageReq(stage) { return Math.max(2, Math.round(STAGE_CARES[stage] * LIFE_MULT[settings.life])); }
function age() {
  if (!pet || pet.stage === 0) return 0;
  const [a0, a1] = STAGES[pet.stage].age;
  return Math.min(a1, a0 + Math.floor(pet.progress / stageReq(pet.stage) * (a1 - a0)));
}
function updateTop() {
  if (!pet) return;
  $('nameTxt').textContent = pet.name || 'Tama Talk';
  $('stageTxt').textContent = STAGES[pet.stage].en + (pet.stage >= 4 && pet.form ? ' · ' + FORMS[pet.form].en : '');
  $('ageTxt').textContent = age();
  $('starTxt').textContent = pet.stars || 0;
  $('growFill').style.width = pet.stage === 0 ? '0%' : Math.min(100, pet.progress / stageReq(pet.stage) * 100) + '%';
}
function buildCats() {
  const nav = $('cats'); nav.innerHTML = '';
  if (!pet || pet.stage === 0) return;
  for (const c of CATEGORIES) {
    if (c.unlock > pet.stage) continue;
    const b = document.createElement('button');
    b.className = 'cat'; b.dataset.cat = c.id;
    b.innerHTML = `<span class="ic">${c.e}</span><span class="lb">${c.en}</span>` + ((pet.seenCats || []).includes(c.id) ? '' : '<span class="new">NEW!</span>');
    b.onclick = () => onCat(c);
    nav.appendChild(b);
  }
}
function markSeen(cat) {
  pet.seenCats = pet.seenCats || [];
  if (!pet.seenCats.includes(cat)) { pet.seenCats.push(cat); save(); const n = document.querySelector(`.cat[data-cat="${cat}"] .new`); if (n) n.remove(); }
}
function glowCats(on) {
  document.querySelectorAll('.cat').forEach(b => b.classList.remove('glow'));
  if (!on || !need) return;
  const cats = new Set(need.ok.map(id => ITEM[id].cat));
  cats.forEach(c => { const b = document.querySelector(`.cat[data-cat="${c}"]`); if (b) b.classList.add('glow'); });
}
function setCatsEnabled(on) { $('cats').classList.toggle('disabled', !on); }

// ---------------------------------------------------------------- tray
function trayItems(cat) {
  const all = byCat(cat);
  if (all.length <= 8) return all;
  const key = (need ? need.key : '-') + '|' + cat;
  if (trayCache[key]) return trayCache[key].map(id => ITEM[id]);
  const chosen = new Set();
  if (need) {
    const oks = need.ok.filter(id => ITEM[id].cat === cat).sort(() => Math.random() - .5).slice(0, 2);
    oks.forEach(id => chosen.add(id));
    Object.keys(need.avoid || {}).filter(id => ITEM[id].cat === cat).forEach(id => chosen.add(id));
  }
  const rest = all.map(i => i.id).filter(id => !chosen.has(id)).sort(() => Math.random() - .5);
  while (chosen.size < 8) chosen.add(rest.shift());
  const list = [...chosen].sort(() => Math.random() - .5);
  trayCache[key] = list;
  return list.map(id => ITEM[id]);
}
function openTray(c) {
  $('trayTitle').textContent = c.e + ' ' + c.en;
  const g = $('trayGrid'); g.innerHTML = '';
  for (const it of trayItems(c.id)) {
    const b = document.createElement('button');
    b.className = 'item';
    const showLabel = settings.labels || it.label;
    b.innerHTML = `<span class="ic${it.txt ? ' txt' : ''}">${it.e}</span>` + (showLabel ? `<span class="lb">${it.en}</span>` : '');
    b.title = it.en;
    b.onclick = () => { const r = b.querySelector('.ic').getBoundingClientRect(); closeTray(); give(it, r); };
    g.appendChild(b);
  }
  $('tray').classList.remove('hidden');
  if (need) view.tx = 40;
  if (!$('bubble').classList.contains('hidden')) tailToPet();
}
function closeTray() { $('tray').classList.add('hidden'); if (!$('bubble').classList.contains('hidden')) tailToPet(); }
$('trayClose').onclick = closeTray;

function onCat(c) {
  if (busy || !pet || pet.stage === 0) return;
  markSeen(c.id);
  if (c.single) { closeTray(); const r = document.querySelector(`.cat[data-cat="${c.id}"] .ic`).getBoundingClientRect(); give(ITEM[c.single], r); return; }
  if (!$('tray').classList.contains('hidden') && $('trayTitle').textContent.includes(c.en)) { closeTray(); return; }
  openTray(c);
}

// ---------------------------------------------------------------- effects
function sceneRect() { return $('scene').getBoundingClientRect(); }
function screenToScene(r) { // DOMRect (screen) -> scene css coords (unscaled)
  const s = sceneRect(), k = s.width / $('scene').offsetWidth;
  return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
}
async function flyEmoji(emoji, fromRect) {
  const el = document.createElement('div'); el.className = 'fly'; el.textContent = emoji;
  const from = fromRect ? screenToScene(fromRect) : { x: 900, y: 200 };
  el.style.left = (from.x - 40) + 'px'; el.style.top = (from.y - 40) + 'px';
  $('fx').appendChild(el); void el.offsetWidth;
  const c = petCenterCss();
  el.style.left = (c.x - 40) + 'px'; el.style.top = (c.y - 40) + 'px'; el.style.transform = 'scale(.7)';
  await sleep(720); el.remove();
}
function floaters(emoji, n = 5) {
  const c = petCenterCss();
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'float'; el.textContent = emoji;
    el.style.left = (c.x - 20 + (Math.random() - .5) * 160) + 'px'; el.style.top = (c.y - 40 + (Math.random() - .5) * 60) + 'px';
    el.style.animationDelay = (i * 0.12) + 's';
    $('fx').appendChild(el); setTimeout(() => el.remove(), 2200);
  }
}
function confetti() {
  const cols = ['#ff3f7a', '#ffd84a', '#2ec4ff', '#6fdc4a', '#ff8a1f'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div'); el.className = 'confetti';
    el.style.left = Math.random() * 1366 + 'px'; el.style.top = '-20px'; el.style.background = cols[i % 5];
    el.style.animationDelay = Math.random() * 0.8 + 's';
    $('fx').appendChild(el); setTimeout(() => el.remove(), 3200);
  }
}
let worn = null;
function wear(emoji) {
  if (worn) worn.remove();
  worn = document.createElement('div'); worn.className = 'worn'; worn.textContent = emoji;
  $('scene').appendChild(worn);
  const w = worn; setTimeout(() => { w.style.opacity = 0; setTimeout(() => { w.remove(); if (worn === w) worn = null; }, 600); }, 5000);
}
function positionWorn() {
  if (!worn) return;
  const b = petBox(), c = toCss(b.x + b.w, b.y + b.h * 0.35);
  worn.style.left = (c.x - 10) + 'px'; worn.style.top = (c.y - 40) + 'px';
}

// ---------------------------------------------------------------- core: giving things
function fill(s, it) { return s.replace(/\{en\}/g, it.en).replace(/\{done\}/g, it.done || ''); }

async function give(it, fromRect) {
  if (busy) return;
  busy = true; setCatsEnabled(false);
  clearTimeout(needTimer);

  if (!need) { // nothing requested – friendly, no growth
    if (it.id === 'hug') { await hop(1, 3); floaters('💗', 4); await say(rnd(["Hehe! I'm happy!", 'I like you!', 'Hehe!']), 1500, 'happy'); }
    else if (it.id === 'cleanup' && pet.poop) { pet.poop = false; save(); await say('Thank you!', 1300, 'happy'); }
    else { await flyEmoji(it.e, fromRect); await say(rnd(["I'm OK. Thank you!", 'No, thank you. Maybe later!']), 1600, 'normal'); }
    hideBubble(); finishBusy(); scheduleNeed(); return;
  }

  if (need.ok.includes(it.id)) await success(it, fromRect);
  else await wrong(it, fromRect);
  finishBusy();
}
function finishBusy() { busy = false; setCatsEnabled(true); }

async function wrong(it, fromRect) {
  need.tries++;
  if (it.id !== 'hug' && it.cat !== 'sleep') await flyEmoji(it.e, fromRect);
  view.shake = 6; setFace('no', 1700);
  const reply = (need.avoid && need.avoid[it.id]) || rnd(NO_THANKS);
  showBubble(reply, { reply: true });
  await sleep(1700);
  if (need.tries >= 3 && !need.hinted) { need.hinted = true; glowCats(true); }
  showNeedBubble();
}

async function success(it, fromRect) {
  const firstTry = need.tries === 0;
  const wasBirthday = need.birthday;
  glowCats(false);
  const cat = it.cat;

  if (cat === 'go' || cat === 'trip') {
    await flyEmoji(it.e, fromRect);
    $('outingEmoji').textContent = it.e; $('outing').classList.remove('hidden');
    view.tx = view.x = 40; hideBubble();
    await hop(3, 5);
    await say(fill(rnd(THANKS[cat]), it), 2300, 'happy');
    $('outing').classList.add('hidden');
  } else if (cat === 'sleep') {
    $('night').classList.remove('hidden'); hideBubble(); setFace('sleep', 3200);
   
    await sleep(3200);
    $('night').classList.add('hidden');
    await hop(1, 3);
    await say('Good morning!', 1500, 'happy');
  } else if (it.id === 'hug') {
    hideBubble(); floaters('💗', 6); await hop(2, 3);
    await say(rnd(THANKS.hug), 1700, 'happy');
  } else if (it.id === 'cleanup') {
    await flyEmoji(it.e, fromRect); pet.poop = false; floaters('✨', 4);
    await say(rnd(THANKS.cleanup), 1500, 'happy');
  } else {
    await flyEmoji(it.e, fromRect);
    if (cat === 'wear') wear(it.e);
    if (cat === 'clean') floaters('🫧', 6);
    if (cat === 'food' || cat === 'drink') { setFace('talk', 900); await sleep(900); }
    hop(2, 3);
    const line = cat === 'wear' && (need.key === 'cold' || need.key === 'snowy') ? 'Warm! Thank you!' : fill(rnd(THANKS[cat]), it);
    await say(line, 1800, 'happy');
  }
  if (wasBirthday) { confetti(); await say('Happy birthday to me! Thank you!', 2200, 'happy'); }

  floaters(firstTry ? '⭐' : '💗', firstTry ? 3 : 2);
  if (firstTry) pet.stars = (pet.stars || 0) + 1;
  pet.cares = (pet.cares || 0) + 1;
  pet.catCounts = pet.catCounts || {};
  pet.catCounts[cat] = (pet.catCounts[cat] || 0) + 1;
  pet.progress++;
  need = null; trayCache = {};
  hideBubble();
  save(); updateTop();
  await checkGrowth();
  if (need) { showNeedBubble(); }
  else if (pet && pet.stage > 0) scheduleNeed();
}

// ---------------------------------------------------------------- growth & old age
async function checkGrowth() {
  if (pet.progress < stageReq(pet.stage)) return;
  if (pet.stage === 5) { await farewell(); return; }
  await say("Wow! I'm growing up!", 1600, 'happy');
  hideBubble();
  view.flash = 1; await sleep(1600); view.flash = 0;
  pet.stage++; pet.progress = 0;
  if (pet.stage === 4) {
    const tally = {};
    for (const [c, n] of Object.entries(pet.catCounts || {})) { const f = FORM_OF_CAT[c]; tally[f] = (tally[f] || 0) + n; }
    pet.form = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'care';
  }
  save(); updateTop(); buildCats();
  await hop(2, 5); confetti();
  if (pet.stage === 4) await say(`${FORMS[pet.form].line} I'm ${FORMS[pet.form].en} ${pet.name}!`, 2600, 'happy');
  else if (pet.stage === 5) await say(`I'm a senior now.`, 2000, 'happy');
  else await say(`I'm a ${STAGES[pet.stage].en.toLowerCase()} now!`, 2000, 'happy');
  const newCats = CATEGORIES.filter(c => c.unlock === pet.stage);
  if (newCats.length) await say(`New: ${newCats.map(c => c.en).join(' and ')}!`, 1800, 'happy');
  need = birthdayNeed(STAGES[pet.stage].age[0]);
}

async function farewell() {
  busy = true; setCatsEnabled(false); clearTimeout(needTimer); closeTray();
  view.tx = view.x = 60;
  await say("I'm 100 years old now.", 2400, 'happy');
  await say(`I had a very happy life. Thank you for everything!`, 3200, 'happy');
  await say('Goodbye! See you!', 2400, 'happy');
  hideBubble();
  view.halo = true; setFace('happy', 9000);
  for (let i = 0; i < 70; i++) { view.float += 0.45; view.alpha = Math.max(0, 1 - i / 70); if (i % 10 === 0) floaters('✨', 2); await sleep(45); }
  const entry = { name: pet.name, color: pet.color, form: pet.form, stars: pet.stars || 0, cares: pet.cares || 0, born: pet.born, end: new Date().toISOString() };
  const alb = load(ALB_KEY, []); alb.unshift(entry); store(ALB_KEY, alb);
  $('byeEn').textContent = `${pet.name} went to Star Land.`;
  $('byeJa').textContent = `${pet.name}は ほしの くにへ いったよ。たいせつに そだてて くれて ありがとう！`;
  $('byeStats').textContent = `⭐ ${entry.stars}  ·  💗 ${entry.cares} requests  ·  100 years old`;
  $('byeCard').classList.remove('hidden');
  pet = null; localStorage.removeItem(SAVE_KEY); $('cats').innerHTML = '';
  view.halo = false; view.float = 0; view.alpha = 1;
  busy = false;
}
$('newEggBtn').onclick = () => { $('byeCard').classList.add('hidden'); startChoice(); };

// ---------------------------------------------------------------- requests
function scheduleNeed(ms) {
  clearTimeout(needTimer);
  if (!pet || pet.stage === 0) return;
  const [a, b] = PACE[settings.pace];
  needTimer = setTimeout(newNeed, ms ?? (a + Math.random() * (b - a)));
}
function newNeed() {
  if (busy || need || !pet || pet.stage === 0) return;
  need = makeNeed(pet.stage);
  if (need.poop) pet.poop = true;
  trayCache = {};
  view.tx = 46;
  showNeedBubble();
  save();
}

$('hintBtn').onclick = () => {
  if (!need || (need.tries < 1 && !need.hinted)) return;
  need.hinted = true; glowCats(true); showNeedBubble();
};

// tap the pet = hug (or egg tap)
$('scene').addEventListener('pointerdown', e => {
  if (!pet || busy) return;
  if (e.target.closest('#bubble, #tray, .card')) return;
  const s = sceneRect(), k = s.width / $('scene').offsetWidth;
  const x = ((e.clientX - s.left) / k - 3) / PX, y = ((e.clientY - s.top) / k - 1) / PX;
  const b = petBox();
  if (x < b.x - 2 || x > b.x + b.w + 2 || y < b.y - 2 || y > b.y + b.h + 2) return;
  if (pet.stage === 0) tapEgg();
  else give(ITEM.hug, null);
});

// ---------------------------------------------------------------- new pet flow
function drawEggPreview(cv, color) {
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
  drawMap(c, SPR.egg.map, 0, 0, palette(color));
}
function startChoice() {
  pet = null; need = null; hideBubble(); closeTray(); buildCats(); setCatsEnabled(false);
  $('nameTxt').textContent = 'Tama Talk'; $('stageTxt').textContent = ''; $('ageTxt').textContent = '0'; $('starTxt').textContent = '0'; $('growFill').style.width = '0%';
  const row = $('eggRow'); row.innerHTML = '';
  for (const col of Object.keys(COLORS)) {
    const b = document.createElement('button'); b.className = 'eggBtn';
    const cv = document.createElement('canvas'); cv.width = 12; cv.height = 15; drawEggPreview(cv, col);
    b.appendChild(cv); b.onclick = () => chooseEgg(col); row.appendChild(b);
  }
  $('eggChoice').classList.remove('hidden');
}
function chooseEgg(color) {
  $('eggChoice').classList.add('hidden');
  pet = { v: 1, color, stage: 0, progress: 0, eggTaps: 0, stars: 0, cares: 0, catCounts: {}, seenCats: [], born: null, name: '' };
  view.x = view.tx = 60;
  save(); updateTop();
  $('tapEgg').classList.remove('hidden');
}
let eggBusy = false;
async function tapEgg() {
  if (eggBusy) return;
  eggBusy = true;
  pet.eggTaps++; view.wobble = 1; await sleep(350); view.wobble = 0;
  if (pet.eggTaps >= 5) {
    $('tapEgg').classList.add('hidden');
    view.wobble = 1; await sleep(900); view.wobble = 0;
    view.flash = 1; await sleep(900); view.flash = 0;
    pet.stage = 1; pet.progress = 0; pet.born = new Date().toISOString();
    save(); updateTop();
    await hop(2, 4);
    askName();
  }
  eggBusy = false;
}

function askName() {
  busy = true;
  const inp = $('nameInput');
  $('nameQ').textContent = "Hello! What's my name?";
  $('nameJa').textContent = 'ペットの なまえを ローマじで かいてね';
  inp.value = ''; inp.placeholder = 'Pochi';
  $('nameCard').classList.remove('hidden'); setTimeout(() => inp.focus(), 50);
}
$('nameInput').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^A-Za-z \-]/g, ''); });
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('nameOk').click(); });
$('nameOk').onclick = async () => {
  let v = $('nameInput').value.trim();
  if (!v) { $('nameInput').focus(); return; }
  v = v.charAt(0).toUpperCase() + v.slice(1);
  $('nameCard').classList.add('hidden');
  pet.name = v; save(); updateTop();
  const d = new Date(pet.born);
  const month = d.toLocaleString('en-US', { month: 'long' });
  await say(`My name is ${v}! Nice to meet you!`, 2200, 'happy');
  await say(`My birthday is ${month} ${d.getDate()}.`, 2400, 'happy');
  hideBubble(); busy = false;
  buildCats(); setCatsEnabled(true);
  scheduleNeed(1500);
};

// ---------------------------------------------------------------- save
function save() {
  if (!pet) return;
  const copy = Object.assign({}, pet);
  store(SAVE_KEY, copy);
}

// ---------------------------------------------------------------- album
function drawPetThumb(cv, e) {
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
  const spr = SPR[5], { w, h } = mapSize(spr.map), x = Math.floor((cv.width - w) / 2) - 1, y = cv.height - h;
  const pal = palette(e.color);
  drawMap(c, spr.map, x, y, pal); drawFace(c, spr, x, y, 'happy', pal, true);
  if (e.form) drawAccessory(c, FORMS[e.form].acc, spr, x, y, w);
}
$('albumBtn').onclick = () => {
  const list = $('albumList'); list.innerHTML = '';
  const alb = load(ALB_KEY, []);
  if (!alb.length) list.innerHTML = '<div class="empty">No pets yet. <br><small>まだ だれも いないよ</small></div>';
  for (const e of alb) {
    const d = document.createElement('div'); d.className = 'alb';
    const cv = document.createElement('canvas'); cv.width = 24; cv.height = 27; drawPetThumb(cv, e);
    d.appendChild(cv);
    const born = e.born ? new Date(e.born).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    d.insertAdjacentHTML('beforeend', `<b>${e.name}</b>${e.form ? FORMS[e.form].en + ' · ' : ''}⭐ ${e.stars}<br><small>Born ${born}${e.reset ? ' · (reset)' : ''}</small>`);
    list.appendChild(d);
  }
  openModal('album');
};

// ---------------------------------------------------------------- settings (hold ⚙ for 1 second)
let holdT = null;
$('gearBtn').addEventListener('pointerdown', () => { $('gearBtn').classList.add('holding'); holdT = setTimeout(() => { $('gearBtn').classList.remove('holding'); openSettings(); }, 1000); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('gearBtn').addEventListener(ev, () => { clearTimeout(holdT); $('gearBtn').classList.remove('holding'); }));
function openSettings() {
  document.querySelectorAll('.seg').forEach(seg => {
    const key = seg.dataset.key; seg.innerHTML = '';
    for (const [val, label] of SETTING_OPTS[key]) {
      const b = document.createElement('button'); b.textContent = label;
      if (settings[key] === val) b.classList.add('on');
      b.onclick = () => { settings[key] = val; store(SET_KEY, settings); openSettings(); updateTop(); applySettings(); };
      seg.appendChild(b);
    }
  });
  openModal('settings');
}
function applySettings() { if (need && !busy) showNeedBubble(); }
function openModal(id) { $('modalBack').classList.remove('hidden'); document.querySelectorAll('.modal').forEach(m => m.classList.toggle('hidden', m.id !== id)); }
function closeModal() { $('modalBack').classList.add('hidden'); }
document.querySelectorAll('.closeModal').forEach(b => b.onclick = closeModal);
$('modalBack').addEventListener('pointerdown', e => { if (e.target === $('modalBack')) closeModal(); });
$('resetBtn').onclick = () => openModal('confirm');
$('confirmNo').onclick = () => openSettings();
$('confirmYes').onclick = () => {
  if (pet && pet.stage > 0) { const alb = load(ALB_KEY, []); alb.unshift({ name: pet.name, color: pet.color, form: pet.form, stars: pet.stars || 0, cares: pet.cares || 0, born: pet.born, reset: true }); store(ALB_KEY, alb); }
  localStorage.removeItem(SAVE_KEY); closeModal(); clearTimeout(needTimer);
  $('nameCard').classList.add('hidden'); $('tapEgg').classList.add('hidden'); $('byeCard').classList.add('hidden');
  busy = false; startChoice();
};

// ---------------------------------------------------------------- boot
function boot() {
  applySettings();
  requestAnimationFrame(render);
  if (!pet) { startChoice(); return; }
  view.x = view.tx = 46;
  updateTop(); buildCats();
  if (pet.stage === 0) { $('tapEgg').classList.remove('hidden'); setCatsEnabled(false); return; }
  if (!pet.name) { askName(); return; }
  // welcome back – nothing bad happened while away
  busy = true; setCatsEnabled(false);
  (async () => {
    await sleep(500);
    await say('Hello! I missed you!', 2000, 'happy');
    hideBubble(); busy = false; setCatsEnabled(true); scheduleNeed(1200);
  })();
}
boot();
