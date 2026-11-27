// ============================================================
//  Tama Talk – main game
//  Pets never get sick or die from missed care. Nothing happens
//  while the game is closed. They only reach old age after a long,
//  well-cared-for life (number of requests answered).
// ============================================================

const $ = id => document.getElementById(id);
const SAVE_KEY = 'tamatalk.save.v1', SET_KEY = 'tamatalk.settings.v1', ALB_KEY = 'tamatalk.album.v1', SHOP_KEY = 'tamatalk.shop.v1';
let FEET = 88;            // pet stands with its feet here (96×96 screen); higher in tama view so the icons don't cover it

const LIFE_MULT = { short: 0.5, normal: 1, long: 2, verylong: 4 };


const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const saved = load(SET_KEY, {});
let settings = { life: 'normal', every: 45, maxWishes: 5, labels: true, shop: true, sound: saved.sound ?? true, view: saved.view || 'normal' };
let shop = Object.assign({ stars: 0, acc: [], rooms: ['home_03'], wearing: null, room: 'home_03', shells: ['shell_13'], shell: 'shell_13' }, load(SHOP_KEY, {}));
if (!shop.shells) { shop.shells = ['shell_13']; shop.shell = 'shell_13'; }
let pet = load(SAVE_KEY, null);
let need = null, busy = false, trayCache = {}, needTimer = null;
window.soundOn = settings.sound;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// old saves (before the real artwork) get a character
if (pet && pet.stage > 0 && !pet.sprite) pet.sprite = rnd(CHARS[STAGE_KEY[pet.stage]]);

// ---------------------------------------------------------------- scaling
let appScale = 1;
function fit() {
  appScale = Math.min(window.innerWidth / 1380, window.innerHeight / 612);
  $('app').style.transform = `translate(-50%, -50%) scale(${appScale})`;
}
window.addEventListener('resize', fit); fit();

// ---------------------------------------------------------------- scene state
const ctx = $('pet').getContext('2d'), fx = $('fxc').getContext('2d');
ctx.imageSmoothingEnabled = fx.imageSmoothingEnabled = false;
const view = { x: 48, tx: 48, jump: 0, flip: false, anim: null, animUntil: 0, wobble: 0, float: 0, alpha: 1, flash: 0, halo: false, walkPause: 0, hidden: false };
let particles = [];
let place = null; // current activity background

// rooms have see-through windows: the sky behind them follows the real time of day (like the original)
function skyNow() { const h = new Date().getHours(); return h >= 19 || h < 5 ? 'night' : h >= 16 ? 'evening' : h >= 10 ? 'afternoon' : 'morning'; }
const FURNISHABLE = ['home_02', 'home_03', 'home_04', 'home_06', 'home_07', 'home_08'];
function hasFurniture() { return (shop.furn || []).some(Boolean); }
function setBg(id) {
  let src = bgSrc(id);
  if (id === (shop.room || 'home_03') && FURNISHABLE.includes(id) && hasFurniture()) src = `assets/bg/${id}_f.png`; // empty room, so our furniture doesn't sit on top of the room's own sofa
  $('bgLayer').style.backgroundImage = `url(${src}), url(assets/bg/sky_${skyNow()}.png)`;
}
function homeBg() { setBg(shop.room || 'home_03'); place = null; $('emojiLayer').innerHTML = decorHtml(); place = null; }
function goPlace(bg, emoji) {
  setBg(bg); place = bg;
  $('emojiLayer').innerHTML = emoji ? `<span class="big">${emoji}</span>` : '';
}
function setAnim(name, ms = 1200) { view.anim = name; view.animUntil = performance.now() + ms; }

function cell() { return CELL[pet.stage] || 16; }
function petRect() {
  if (pet.stage === 0) return { x: Math.round(view.x - 8), y: FEET - 16, w: 16, h: 16 };
  const cs = cell();
  return { x: Math.round(view.x - cs / 2), y: Math.round(FEET - cs - view.jump - view.float), w: cs, h: cs };
}

// white silhouette for the "growing" flash
const tmp = document.createElement('canvas'); tmp.width = tmp.height = 64;
const tctx = tmp.getContext('2d'); tctx.imageSmoothingEnabled = false;

function drawCell(c, im, cellNo, cs, x, y, flip, white) {
  if (!im.complete || !im.naturalWidth) return;
  const i = cellNo - 1, sx = (i % 4) * cs, sy = Math.floor(i / 4) * cs;
  let src = im, ssx = sx, ssy = sy;
  if (white) {
    tctx.clearRect(0, 0, 64, 64); tctx.globalCompositeOperation = 'source-over';
    tctx.drawImage(im, sx, sy, cs, cs, 0, 0, cs, cs);
    tctx.globalCompositeOperation = 'source-atop'; tctx.fillStyle = '#fff'; tctx.fillRect(0, 0, 64, 64);
    tctx.globalCompositeOperation = 'source-over';
    src = tmp; ssx = 0; ssy = 0;
  }
  c.save();
  if (flip) { c.translate(x + cs, y); c.scale(-1, 1); c.drawImage(src, ssx, ssy, cs, cs, 0, 0, cs, cs); }
  else c.drawImage(src, ssx, ssy, cs, cs, x, y, cs, cs);
  c.restore();
}
// Accessories are drawn for a "standard" adult. To make them fit every pet, we line the
// accessory up with this pet's real head (top of the sprite) and scale it to its real width.
const REF_TOP = 17, REF_W = 28, REF_CX = 32;   // standard adult inside the 64px accessory cell
function drawAcc(c, accId, cellNo, r, flip, spriteId) {
  const im = img(`assets/acc/${accId}.png`);
  if (!im.complete || !im.naturalWidth) return;
  const i = cellNo - 1, sx = (i % 4) * 64, sy = Math.floor(i / 4) * 64;
  const pb = spriteId && BBOX[spriteId], ab = ACC_BBOX[accId];
  let dx, dy, size;
  if (pb && ab && ab[i * 4 + 2]) {
    const [l, t, rt] = pb.slice(i * 4, i * 4 + 3), [l1, t1, r1] = pb.slice(0, 3);
    const s = Math.max(0.4, Math.min(1.25, (r1 - l1) / REF_W));       // size from the pet's width
    const a1x = (ab[0] + ab[2]) / 2, a1t = ab[1];                       // accessory in frame 1
    const akx = (ab[i * 4] + ab[i * 4 + 2]) / 2, akt = ab[i * 4 + 1];   // accessory in this frame
    const cx = (l + rt) / 2;                                            // pet head in this frame
    size = 64 * s;
    dx = cx + (a1x - REF_CX) * s - akx * s;
    dy = t + (a1t - REF_TOP) * s - akt * s;
  } else { // no data: old centred placement
    size = 64 * r.w / 32; dx = r.w / 2 - size / 2; dy = r.h / 2 - size / 2;
  }
  c.save();
  c.translate(r.x, r.y);
  if (flip) { c.translate(r.w, 0); c.scale(-1, 1); }
  c.drawImage(im, sx, sy, 64, 64, dx, dy, size, size);
  c.restore();
}

function currentFrame(t) {
  let name = 'idle';
  if (view.anim && t < view.animUntil) name = view.anim;
  else if (Math.abs(view.tx - view.x) > 0.4) name = 'walk';
  else if (need && need.key === 'sad') name = 'sad';
  const a = ANIM[name];
  return { name, cell: a.f[Math.floor(t / a.t) % a.f.length] };
}

function render(t) {
  ctx.clearRect(0, 0, 96, 96); fx.clearRect(0, 0, 96, 96);
  if (window.actScene) { try { actScene.draw(ctx, t); } catch (e) { console.error(e); } }
  else if (pet && !view.hidden) {
    if (!place && typeof drawDecor === 'function') drawDecor(ctx, t);
    // poop
    if (pet.poop && !place) {
      const p = img('assets/misc/poop.png'); if (p.complete) ctx.drawImage(p, 70, FEET - 14 + (Math.floor(t / 400) % 2));
      const s = img('assets/misc/stinky_01.png'); if (s.complete) { ctx.globalAlpha = .7; ctx.drawImage(s, 0, 0, 16, 16, 70, FEET - 28 - (Math.floor(t / 300) % 3), 16, 16); ctx.globalAlpha = 1; }
    }
    // walking around
    if (!busy && !need && pet.stage > 0 && t > view.walkPause && Math.abs(view.tx - view.x) < 0.5) {
      view.tx = 22 + Math.random() * 52; view.walkPause = t + 2000 + Math.random() * 3000;
    }
    const speed = pet.stage === 5 ? 0.12 : 0.22;
    if (Math.abs(view.tx - view.x) > 0.3) { view.flip = view.tx > view.x; view.x += Math.sign(view.tx - view.x) * Math.min(speed, Math.abs(view.tx - view.x)); }

    const r = petRect();
    // shadow
    const sh = img('assets/misc/shadow_01.png');
    if (sh.complete && view.float === 0) { ctx.globalAlpha = .35 * view.alpha; ctx.drawImage(sh, r.x + r.w / 2 - r.w * 0.45, FEET - r.w * 0.22, r.w * 0.9, r.w * 0.45); }
    ctx.globalAlpha = view.alpha;

    if (pet.stage === 0) {
      const egg = img('assets/misc/egg_normal_01.png');
      const wob = view.wobble ? Math.round(Math.sin(t / 40) * 1.5) : 0;
      if (egg.complete) ctx.drawImage(egg, pet.eggTaps >= 3 ? 16 : 0, 0, 16, 16, r.x + wob, r.y, 16, 16);
    } else {
      const f = currentFrame(t);
      const sideways = f.name === 'walk' || f.name === 'talk';
      const flip = sideways && view.flip;
      const bob = f.name === 'idle' && Math.floor(t / 500) % 2 ? 1 : 0;
      const rr = { ...r, y: r.y + bob };
      const im = img(charSrc(pet.sprite));
      const acc = f.name === 'sleep' ? null : ACCS.find(a => a.id === shop.wearing);
      if (acc && !acc.front && !view.flash) drawAcc(ctx, acc.id, f.cell, rr, flip, pet.sprite);
      drawCell(ctx, im, f.cell, r.w, rr.x, rr.y, flip, view.flash && Math.floor(t / 90) % 2);
      if (acc && acc.front && !view.flash) drawAcc(ctx, acc.id, f.cell, rr, flip, pet.sprite);
      if (view.halo) drawAcc(ctx, 'angel_halo_01', 1, rr, false, pet.sprite);
    }
    ctx.globalAlpha = 1;
  }
  // particles
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--;
    const im = img(p.src);
    if (!im.complete) continue;
    fx.globalAlpha = Math.min(1, p.life / 20);
    fx.drawImage(im, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s * (im.naturalHeight / im.naturalWidth));
  }
  fx.globalAlpha = 1;
  requestAnimationFrame(render);
}
function burst(kind, n = 5) {
  const r = pet ? petRect() : { x: 40, y: 50, w: 16, h: 16 };
  const cx = r.x + r.w / 2, cy = r.y + r.h / 3;
  const src = { heart: 'assets/misc/heart_particle_01.png', star: 'assets/misc/star_01.png', foam: 'assets/misc/foam_single.png', z: 'assets/misc/sleep_z_01.png', twinkle: 'assets/misc/twinkle_01.png' }[kind];
  for (let i = 0; i < n; i++) {
    particles.push({
      src, x: cx + (Math.random() - .5) * r.w, y: cy + (Math.random() - .5) * 8,
      vx: (Math.random() - .5) * (kind === 'z' ? .2 : .6), vy: kind === 'foam' ? -.2 - Math.random() * .3 : -.35 - Math.random() * .4,
      s: { heart: 8, star: 9, foam: 9 + Math.random() * 5, z: 7, twinkle: 10 }[kind], life: 50 + Math.random() * 30,
    });
  }
}
async function hop(n = 2, h = 5) {
  for (let i = 0; i < n; i++) {
    for (let f = 0; f <= 10; f++) { view.jump = Math.sin(f / 10 * Math.PI) * h; await sleep(24); }
    view.jump = 0; await sleep(60);
  }
}

// ---------------------------------------------------------------- bubble
function showBubble(text, { reply = false } = {}) {
  const bub = $('bubble'), t = $('bubbleText');
  bub.classList.remove('hidden', 'pop'); void bub.offsetWidth; bub.classList.add('pop');
  t.classList.toggle('reply', reply);
  t.textContent = text;
  $('bubbleBtns').classList.toggle('hidden', reply);
}
function hideBubble() { $('bubble').classList.add('hidden'); }
function showNeedBubble() {
  if (!need) return;
  showBubble(need.en);
  $('hintBtn').classList.toggle('hidden', !!need.activity);
  $('goBtn').classList.toggle('hidden', !need.activity);
  $('hintBtn').classList.toggle('off', need.tries < 1 && !need.hinted);
}
async function say(text, ms = 1800, anim = 'cheer') {
  showBubble(text, { reply: true }); setAnim(anim, ms); await sleep(ms);
}

// ---------------------------------------------------------------- top bar / profile
function stageReq(stage) { return Math.max(2, Math.round(STAGE_CARES[stage] * LIFE_MULT[settings.life])); }
function age() {
  if (!pet || pet.stage === 0) return 0;
  const [a0, a1] = STAGES[pet.stage].age;
  return Math.min(a1, a0 + Math.floor(pet.progress / stageReq(pet.stage) * (a1 - a0)));
}
function accuracy(s) { return s && s.asked ? s.first / s.asked : 0; }
function careStars(a) { return a >= 0.8 ? 3 : a >= 0.5 ? 2 : 1; }
function updateTop() {
  $('starTxt').textContent = shop.stars;
  $('shopBtn').classList.toggle('hidden', !settings.shop);
  if (!pet) { $('nameTxt').textContent = 'Tama Talk'; $('stageTxt').textContent = ''; $('ageTxt').textContent = '0'; $('growFill').style.width = '0%'; updateProfile(); return; }
  $('nameTxt').textContent = pet.name || 'Tama Talk';
  $('stageTxt').textContent = STAGES[pet.stage].en;
  $('ageTxt').textContent = age();
  $('growFill').style.width = pet.stage === 0 ? '0%' : Math.min(100, pet.progress / stageReq(pet.stage) * 100) + '%';
  updateProfile();
}
function fmtMin(m) { return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; }
function updateProfile() {
  const box = $('profile');
  if (!pet || pet.stage === 0 || !pet.name) { box.innerHTML = '<h3>🥚 Tama Talk</h3>'; return; }
  const st = pet.stats?.[pet.stage];
  const care = st && st.asked ? careStars(accuracy(st)) : 0;
  const fav = Object.entries(pet.itemCounts || {}).sort((a, b) => b[1] - a[1])[0];
  const born = pet.born ? new Date(pet.born).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';
  const left = stageReq(pet.stage) - pet.progress;
  box.innerHTML = `<h3><canvas width="32" height="32" id="profPic"></canvas>${pet.name}</h3>
    <div class="prow"><span>Birthday</span><span>${born}</span></div>
    <div class="prow"><span>Age</span><span>${age()} · ${STAGES[pet.stage].en}</span></div>
    <div class="prow"><span>English care</span><span class="care">${care ? '★'.repeat(care) + '☆'.repeat(3 - care) : '–'}</span></div>
    <div class="prow"><span>Favorite</span><span>${fav ? ITEM[fav[0]].e + ' ' + ITEM[fav[0]].en : '–'}</span></div>
    <div class="prow"><span>${pet.stage === 5 ? 'Life' : 'Next stage'}</span><span>${left} more 💗</span></div>
    <div class="prow"><span>Wishes</span><span>${pet.wishes > 0 ? '💭 ' + pet.wishes : 'Next in ' + fmtMin(nextWishIn())}</span></div>`;
  const pc = $('profPic').getContext('2d'); pc.imageSmoothingEnabled = false;
  const im = img(charSrc(pet.sprite)); const cs = cell();
  const draw = () => { pc.clearRect(0, 0, 32, 32); drawCell(pc, im, 1, cs, (32 - cs) / 2, 32 - cs, false); };
  if (im.complete) draw(); else im.onload = draw;
}

// ---------------------------------------------------------------- category buttons (bar + tama icons)
function buildCats() {
  const nav = $('cats'); nav.innerHTML = ''; $('iconsTop').innerHTML = ''; $('iconsBot').innerHTML = '';
  if (!pet || pet.stage === 0 || !pet.name) return;
  const list = CATEGORIES.filter(c => c.unlock <= pet.stage);
  list.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'cat'; b.dataset.cat = c.id;
    b.innerHTML = `<span class="ic">${c.e}</span><span class="lb">${c.en}</span>` + ((pet.seenCats || []).includes(c.id) ? '' : '<span class="new">NEW!</span>');
    b.onclick = () => onCat(c);
    nav.appendChild(b);
    const ic = document.createElement('button');
    ic.dataset.cat = c.id; ic.innerHTML = `<span>${c.e}</span><b>${c.en}</b>`; ic.title = c.en;
    ic.onclick = () => { selIcon = i; markIcon(); onCat(c); };
    (i < Math.ceil(list.length / 2) ? $('iconsTop') : $('iconsBot')).appendChild(ic);
  });
  markIcon();
}
function markSeen(cat) {
  pet.seenCats = pet.seenCats || [];
  if (!pet.seenCats.includes(cat)) { pet.seenCats.push(cat); save(); const n = document.querySelector(`.cat[data-cat="${cat}"] .new`); if (n) n.remove(); }
}
function glowCats(on) {
  document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('glow'));
  if (!on || !need) return;
  new Set(need.ok.map(id => ITEM[id].cat)).forEach(c => document.querySelectorAll(`[data-cat="${c}"]`).forEach(b => b.classList.add('glow')));
}
function setCatsEnabled(on) { $('cats').classList.toggle('disabled', !on); }

// tamagotchi buttons: A = next icon, B = choose, C = cancel
let selIcon = 0;
function iconButtons() { return [...document.querySelectorAll('.icons button')]; }
function markIcon() { iconButtons().forEach((b, i) => b.classList.toggle('sel', i === selIcon)); }
document.querySelectorAll('#shellBtns button').forEach(b => b.onclick = () => {
  sfx('shell_button_down.ogg', .5);
  if (!pet) return;
  if (pet.stage === 0) { tapEgg(); return; }
  const icons = iconButtons(); if (!icons.length) return;
  const k = b.dataset.b;
  if (k === 'A') { selIcon = (selIcon + 1) % icons.length; markIcon(); }
  if (k === 'B') { const tray = $('tray'); if (!tray.classList.contains('hidden')) { const first = $('trayGrid').querySelector('.item.sel') || null; if (first) first.click(); else icons[selIcon].click(); } else icons[selIcon].click(); }
  if (k === 'C') closeTray();
});

// ---------------------------------------------------------------- tray
function trayItems(cat) {
  const all = byCat(cat);
  if (all.length <= 9) return all;
  const key = (need ? need.key : '-') + '|' + cat;
  if (trayCache[key]) return trayCache[key].map(id => ITEM[id]);
  const chosen = new Set();
  if (need) {
    need.ok.filter(id => ITEM[id].cat === cat).sort(() => Math.random() - .5).slice(0, 2).forEach(id => chosen.add(id));
    Object.keys(need.avoid || {}).filter(id => ITEM[id].cat === cat).forEach(id => chosen.add(id));
  }
  const rest = all.map(i => i.id).filter(id => !chosen.has(id)).sort(() => Math.random() - .5);
  while (chosen.size < 9) chosen.add(rest.shift());
  const list = [...chosen].sort(() => Math.random() - .5);
  trayCache[key] = list;
  return list.map(id => ITEM[id]);
}
function openTray(c) {
  $('trayTitle').textContent = c.e + ' ' + c.en; $('tray').dataset.cat = c.id;
  const g = $('trayGrid'); g.innerHTML = '';
  for (const it of trayItems(c.id)) {
    const b = document.createElement('button');
    b.className = 'item';
    b.innerHTML = `<span class="ic${it.txt ? ' txt' : ''}">${it.e}</span>` + (settings.labels || it.label ? `<span class="lb">${it.en}</span>` : '');
    b.title = it.en;
    b.onclick = () => { const r = b.querySelector('.ic').getBoundingClientRect(); closeTray(); give(it, r); };
    g.appendChild(b);
  }
  $('tray').classList.remove('hidden'); $('profile').classList.add('hidden');
  sfx('ui_click_01.ogg', .4);
}
function closeTray() { $('tray').classList.add('hidden'); $('profile').classList.remove('hidden'); }
$('trayClose').onclick = closeTray;

function onCat(c) {
  if (busy || !pet || pet.stage === 0) return;
  markSeen(c.id);
  if (c.single) { closeTray(); const el = document.querySelector(`[data-cat="${c.id}"]:not(.hidden)`); give(ITEM[c.single], el && el.getBoundingClientRect()); return; }
  if (!$('tray').classList.contains('hidden') && $('tray').dataset.cat === c.id) { closeTray(); return; }
  openTray(c);
}

// ---------------------------------------------------------------- effects outside the screen
function toApp(x, y) { const a = $('app').getBoundingClientRect(); return { x: (x - a.left) / appScale, y: (y - a.top) / appScale }; }
function petOnPage() {
  const s = $('screen').getBoundingClientRect(), r = pet ? petRect() : { x: 40, y: 60, w: 16, h: 16 };
  return { x: s.left + (r.x + r.w / 2) / 96 * s.width, y: s.top + (r.y + r.h / 2) / 96 * s.height };
}
async function flyEmoji(emoji, fromRect) {
  const el = document.createElement('div'); el.className = 'fly'; el.textContent = emoji;
  const from = fromRect ? toApp(fromRect.left + fromRect.width / 2, fromRect.top + fromRect.height / 2) : { x: 1100, y: 250 };
  el.style.left = (from.x - 40) + 'px'; el.style.top = (from.y - 40) + 'px';
  $('fxApp').appendChild(el); void el.offsetWidth;
  const p = petOnPage(), to = toApp(p.x, p.y);
  el.style.left = (to.x - 40) + 'px'; el.style.top = (to.y - 40) + 'px'; el.style.transform = 'scale(.5)';
  sfx('swoosh_01.ogg', .35);
  await sleep(720); el.remove();
}
function confetti() {
  const cols = ['#ff3f7a', '#ffd84a', '#2ec4ff', '#6fdc4a', '#ff8a1f'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div'); el.className = 'confetti';
    el.style.left = Math.random() * 1366 + 'px'; el.style.top = '-20px'; el.style.background = cols[i % 5];
    el.style.animationDelay = Math.random() * 0.8 + 's';
    $('fxApp').appendChild(el); setTimeout(() => el.remove(), 3200);
  }
}

// ---------------------------------------------------------------- giving things
function fill(s, it) { return s.replace(/\{en\}/g, it.en).replace(/\{done\}/g, it.done || ''); }

async function give(it, fromRect) {
  if (busy) return;
  busy = true; setCatsEnabled(false); clearTimeout(needTimer);
  if (!need) { // nothing requested – friendly, no growth
    if (it.id === 'hug') { sfx('cute.ogg'); burst('heart', 4); setAnim('blush', 1500); await hop(1, 3); await say(rnd(["Hehe! I'm happy!", 'I like you!', 'Hehe!']), 1500, 'blush'); }
    else if (it.id === 'cleanup' && pet.poop) { pet.poop = false; save(); burst('twinkle', 3); await say('Thank you!', 1300); }
    else { await flyEmoji(it.e, fromRect); sfx('refuse.ogg', .4); await say(rnd(["I'm OK. Thank you!", 'No, thank you. Maybe later!']), 1600, 'idle'); }
    hideBubble(); finishBusy(); return;
  }
  if (need.activity) { finishBusy(); return startActivity(); }
  if (need.ok.includes(it.id)) await success(it, fromRect); else await wrong(it, fromRect);
  finishBusy();
}
function finishBusy() { busy = false; setCatsEnabled(true); }

async function wrong(it, fromRect) {
  need.tries++;
  if (it.id !== 'hug' && it.cat !== 'sleep') await flyEmoji(it.e, fromRect);
  sfx('refuse.ogg'); setAnim('refuse', 1700);
  const reply = (need.avoid && need.avoid[it.id]) || rnd(NO_THANKS);
  showBubble(reply, { reply: true });
  await sleep(1700);
  if (need.tries >= 3 && !need.hinted) { need.hinted = true; glowCats(true); }
  showNeedBubble();
}

async function success(it, fromRect) {
  const firstTry = need.tries === 0, wasBirthday = need.birthday, cat = it.cat;
  glowCats(false);
  const where = PLACE_OF[it.id] || (CAT_PLACE[cat] && { bg: CAT_PLACE[cat], e: cat === 'trip' ? it.e : '' });
  const fancy = need.en.startsWith("I'd like");

  if (cat === 'food' || cat === 'drink') {
    goPlace(fancy ? 'restaurant' : 'kitchen');
    view.tx = view.x = 48; hideBubble();
    await flyEmoji(it.e, fromRect);
    sfx('eat.ogg'); setAnim('eat', 1400); await sleep(1400);
    hop(1, 3);
    await say(fill(rnd(THANKS[cat]), it), 1800);
  } else if (cat === 'sleep') {
    $('nightLayer').classList.remove('hidden'); hideBubble(); setAnim('sleep', 3400);
    const zz = setInterval(() => burst('z', 1), 500);
    await sleep(3400); clearInterval(zz);
    $('nightLayer').classList.add('hidden');
    sfx('jump.ogg'); await hop(1, 4);
    await say('Good morning!', 1500);
  } else if (it.id === 'hug') {
    hideBubble(); sfx('cute.ogg'); burst('heart', 7); setAnim('blush', 1200); await hop(2, 3);
    await say(rnd(THANKS.hug), 1700, 'blush');
  } else if (it.id === 'cleanup') {
    await flyEmoji(it.e, fromRect); pet.poop = false; burst('twinkle', 4); sfx('pop_01.mp3');
    await say(rnd(THANKS.cleanup), 1500);
  } else if (cat === 'clean') {
    goPlace('bathroom'); view.tx = view.x = 48; hideBubble();
    await flyEmoji(it.e, fromRect);
    burst('foam', 9); sfx('pop_01.mp3'); setAnim('sit', 1200); await sleep(1300);
    burst('twinkle', 3); hop(1, 3);
    await say(rnd(THANKS.clean), 1800);
  } else if (where) {
    await flyEmoji(it.e, fromRect); hideBubble();
    sfx('swoosh_01.ogg', .5);
    goPlace(where.bg, where.e);
    view.tx = view.x = 36; sfx('cheer.ogg', .5); setAnim('cheer', 1500);
    await hop(3, 5);
    await say(fill(rnd(THANKS[cat] || THANKS.fun), it), 2300);
  } else { // wear etc.
    await flyEmoji(it.e, fromRect);
    $('emojiLayer').innerHTML = `<span class="big">${it.e}</span>`;
    sfx('cheer.ogg', .5); hop(2, 3);
    const line = cat === 'wear' && (need.key === 'cold' || need.key === 'snowy') ? 'Warm! Thank you!' : fill(rnd(THANKS[cat] || THANKS.wear), it);
    await say(line, 1800);
  }
  if (wasBirthday) { sfx('birthday_song_01.ogg', .5); confetti(); await say('Happy birthday to me! Thank you!', 2400); }
  await completeWish({ firstTry, stars: firstTry ? 2 : 1, itemId: it.id, diary: pastLine(it), birthday: wasBirthday });
}

// bookkeeping after any wish (a "give me ~" wish or an activity)
async function completeWish({ firstTry = true, stars = 1, itemId = null, diary = null, birthday = false, activity = false }) {
  homeBg();
  burst(firstTry ? 'star' : 'heart', firstTry ? 3 : 2);
  sfx(firstTry ? 'cheer_success.ogg' : 'task_complete.ogg', .5);
  shop.stars += stars; store(SHOP_KEY, shop);
  pet.starsEarned = (pet.starsEarned || 0) + stars;
  pet.cares = (pet.cares || 0) + 1;
  pet.stats = pet.stats || {}; const st = (pet.stats[pet.stage] = pet.stats[pet.stage] || { asked: 0, first: 0 });
  st.asked++; if (firstTry) st.first++;
  if (itemId) { pet.itemCounts = pet.itemCounts || {}; pet.itemCounts[itemId] = (pet.itemCounts[itemId] || 0) + 1; }
  addDiary(diary);
  noteWish(firstTry);
  pet.lastWasAct = activity;
  pet.progress++;
  if (!birthday) pet.wishes = Math.max(0, (pet.wishes || 1) - 1);
  need = null; trayCache = {};
  hideBubble(); save(); updateTop();
  await checkGrowth();
  if (need) showNeedBubble();
  else if (pet && pet.stage > 0) { accrue(); if (pet.wishes > 0) scheduleNeed(); else await allDone(); }
}

async function startActivity() {
  if (busy || !need || !need.activity) return;
  const a = need.activity;
  busy = true; setCatsEnabled(false); clearTimeout(needTimer); closeTray(); hideBubble();
  markToday(a.id);
  let r;
  try { r = await a.run(); } catch (e) { console.error(e); r = { good: true, stars: 1 }; }
  endScene(); view.x = view.tx = 48; view.anim = null; view.flip = false; view.jump = 0;
  await completeWish({ firstTry: r.good, stars: r.stars, diary: r.diary, activity: true });
  finishBusy();
}

// ---------------------------------------------------------------- growth & old age
async function checkGrowth() {
  if (pet.progress < stageReq(pet.stage)) return;
  if (pet.stage === 5) { await farewell(); return; }
  const stg = pet.stats?.[pet.stage];
  const care = stg && stg.asked ? careStars(accuracy(stg)) : 2;
  await say("Wow! I'm growing up!", 1600, 'shocked');
  hideBubble();
  view.flash = 1; sfx('blush.ogg'); await sleep(1700);
  const options = GROWTH[pet.sprite] || [];
  const next = pet.stage + 1;
  let sprite = options.length === 1 ? options[0] : options[care - 1];
  if (!sprite || !CHARS[STAGE_KEY[next]].includes(sprite)) sprite = rnd(CHARS[STAGE_KEY[next]]);
  pet.sprite = sprite; pet.stage = next; pet.progress = 0;
  view.flash = 0;
  save(); updateTop(); buildCats();
  sfx('cheer_success.ogg'); burst('twinkle', 5); await hop(2, 5); confetti();
  await say(pet.stage === 5 ? "I'm a senior now." : `I'm a ${STAGES[pet.stage].en.toLowerCase()} now!`, 2000);
  const newCats = CATEGORIES.filter(c => c.unlock === pet.stage);
  if (newCats.length) await say(`New: ${newCats.map(c => c.en).join(' and ')}!`, 1800);
  need = birthdayNeed(STAGES[pet.stage].age[0]);
}

async function farewell() {
  busy = true; setCatsEnabled(false); clearTimeout(needTimer); closeTray();
  view.tx = view.x = 48;
  await say("I'm 100 years old now.", 2400, 'idle');
  await say('I had a very happy life. Thank you for everything!', 3200, 'blush');
  await say('Goodbye! See you!', 2400);
  hideBubble();
  view.halo = true; setAnim('cheer', 9000);
  for (let i = 0; i < 80; i++) { view.float += 0.6; view.alpha = Math.max(0, 1 - i / 80); if (i % 10 === 0) burst('twinkle', 2); await sleep(45); }
  const entry = { name: pet.name, sprite: pet.sprite, stars: pet.starsEarned || 0, cares: pet.cares || 0, born: pet.born, end: new Date().toISOString(), gen: pet.gen || 1, parent: pet.parent || null };
  heir = { parent: pet.name, gen: (pet.gen || 1) + 1, egg: pet.egg ?? 0 };
  count('pets'); setCount('gen', heir.gen);
  const alb = load(ALB_KEY, []); alb.unshift(entry); store(ALB_KEY, alb);
  $('byeEn').textContent = `${pet.name} went to Star Land. ${pet.name} left an egg for you!`;
  $('byeStats').textContent = `⭐ ${entry.stars}  ·  💗 ${entry.cares} requests  ·  100 years old`;
  $('byeCard').classList.remove('hidden');
  pet = null; localStorage.removeItem(SAVE_KEY); buildCats(); updateTop();
  view.halo = false; view.float = 0; view.alpha = 1;
  busy = false;
}
let heir = null;
$('newEggBtn').onclick = () => { $('byeCard').classList.add('hidden'); startChoice(); if (heir) { const h = heir; heir = null; $('eggChoice').classList.add('hidden'); chooseEgg(h.egg, h); } };

// ---------------------------------------------------------------- requests (based on real time)
// The pet saves up one wish every `settings.every` minutes – also while the game is closed –
// up to `settings.maxWishes`. When all wishes are done it is happy and leaves you alone.
const MIN = 60000;
function accrue() {
  if (!pet || pet.stage === 0 || !pet.name) return;
  const now = Date.now(), step = settings.every * MIN;
  if (!pet.wishAt) { pet.wishAt = now; pet.wishes = pet.wishes ?? 3; }
  const n = Math.floor((now - pet.wishAt) / step);
  if (n > 0) {
    pet.wishes = Math.min(settings.maxWishes, (pet.wishes || 0) + n);
    pet.wishAt = pet.wishes >= settings.maxWishes ? now : pet.wishAt + n * step;
  }
  if (pet.wishes >= settings.maxWishes) pet.wishAt = now; // full: the clock waits
}
function nextWishIn() { if (!pet.wishAt) return settings.every; return Math.max(0, Math.ceil((pet.wishAt + settings.every * MIN - Date.now()) / MIN)); }
function scheduleNeed(ms) {
  clearTimeout(needTimer);
  if (!pet || pet.stage === 0) return;
  needTimer = setTimeout(newNeed, ms ?? 1500 + Math.random() * 2000);
}
async function newNeed() {
  if (busy || need || !pet || pet.stage === 0 || !pet.name) return;
  accrue();
  if (!(pet.wishes > 0)) { updateProfile(); return; }
  const act = pickActivity();
  if (act) need = { key: 'act:' + act.id, en: act.intro(), ok: [], tries: 0, activity: act };
  else need = eventNeed() || makeNeed(pet.stage);
  if (need.poop) pet.poop = true;
  trayCache = {}; view.tx = 48;
  showNeedBubble(); sfx('pop_01.mp3', .4);
  save();
}
async function allDone() {
  busy = true; setCatsEnabled(false);
  await say(rnd(["Thank you! I'm happy now. See you later!", "I'm happy! See you later!", 'Thank you! Bye-bye! See you soon!']), 2400);
  hideBubble(); busy = false; setCatsEnabled(true); updateProfile();
}
// check the clock while the game is open
setInterval(() => {
  if (!pet || pet.stage === 0 || !pet.name) return;
  const had = pet.wishes || 0; accrue();
  if (pet.wishes !== had) save();
  if (!need && !busy && pet.wishes > 0) newNeed();
  updateProfile();
}, 20000);
function markSeenTime() { if (pet) { pet.lastSeen = Date.now(); save(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) markSeenTime(); else if (pet && pet.name && !busy) welcomeBack(); });
window.addEventListener('pagehide', markSeenTime);
setInterval(markSeenTime, 30000);

// what the pet says when you come back
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Hello!' : h < 11 ? 'Good morning!' : h < 17 ? 'Hello!' : 'Good evening!';
}
function diaryLine(stage) {
  const pick = c => rnd(byCat(c));
  const opts = [() => `I ate ${pick('food').a}.`, () => `I played ${rnd(byCat('play').filter(i => i.sport)).en}.`];
  if (stage >= 2) opts.push(() => pick('fun').done);
  if (stage >= 3) opts.push(() => `I went to ${pick('go').en}.`, () => `I studied ${pick('study').en}.`);
  return rnd(opts)() + ' ' + rnd(['It was fun!', 'It was great!', 'I enjoyed it!']);
}
let welcoming = false;
async function welcomeBack() {
  if (welcoming || !pet || pet.stage === 0) return;
  const away = Date.now() - (pet.lastSeen || Date.now());
  if (away < 10 * MIN) { // only a short break – carry on quietly
    pet.lastSeen = Date.now(); accrue(); save(); updateProfile();
    if (!need && !busy && pet.wishes > 0) scheduleNeed(800);
    return;
  }
  welcoming = true; busy = true; setCatsEnabled(false); clearTimeout(needTimer); noteVisit();
  need = null; hideBubble();
  accrue(); save(); updateTop();
  const hours = away / (60 * MIN), days = Math.floor(hours / 24);
  if (away >= 10 * MIN) {
    await say(greeting() + (hours >= 2 ? ' I missed you!' : ''), 2000);
    if (days >= 2) await say(`It's been ${days} days!`, 1800, 'shocked');
    if (days >= 1) await say(`Yesterday, ${diaryLine(pet.stage).replace(/^I/, 'I')}`, 3000);
    else if (hours >= 2) await say(`Today, ${diaryLine(pet.stage)}`, 3000);
    if (days >= 1) { // a small present for coming back
      const gift = Math.min(3, days);
      shop.stars += gift; store(SHOP_KEY, shop); updateTop(); burst('star', gift); sfx('task_complete.ogg', .5);
      await say(`I found ${gift} star${gift > 1 ? 's' : ''} for you!`, 2000);
    }
    if (hours >= 8 && !pet.poop) pet.poop = true;
  }
  if (pet.wishes > 0) await say(pet.wishes > 1 ? `I have ${pet.wishes} wishes today!` : 'I have a wish!', 1800);
  else await say(`I'm happy! Come back later.`, 1800);
  pet.lastSeen = Date.now(); save();
  hideBubble(); busy = false; welcoming = false; setCatsEnabled(true);
  if (pet.wishes > 0) scheduleNeed(800);
}
$('goBtn').onclick = () => startActivity();
$('hintBtn').onclick = () => {
  if (!need || (need.tries < 1 && !need.hinted)) return;
  need.hinted = true; glowCats(true); showNeedBubble();
};

// tap the pet = hug (or egg tap)
function screenXY(e) { const s = $('screen').getBoundingClientRect(); return [(e.clientX - s.left) / s.width * 96, (e.clientY - s.top) / s.height * 96]; }
$('screen').addEventListener('pointermove', e => { if (window.actScene && actScene.move) actScene.move(...screenXY(e)); });
$('screen').addEventListener('pointerdown', e => {
  if (window.actScene) { const [x, y] = screenXY(e); actScene.move && actScene.move(x, y); actScene.tap && actScene.tap(x, y); return; }
  if (!pet || busy) return;
  const [x, y] = screenXY(e);
  const r = petRect();
  if (x < r.x - 4 || x > r.x + r.w + 4 || y < r.y - 4 || y > r.y + r.h + 4) return;
  if (pet.stage === 0) tapEgg(); else give(ITEM.hug, null);
});

// ---------------------------------------------------------------- new pet flow
const EGG_HUES = [0, 90, 180, 250, 320];
function startChoice() {
  pet = null; need = null; hideBubble(); closeTray(); buildCats(); setCatsEnabled(false); homeBg(); updateTop();
  const row = $('eggRow'); row.innerHTML = '';
  const egg = img('assets/misc/egg_normal_01.png');
  EGG_HUES.forEach((h, i) => {
    const b = document.createElement('button'); b.className = 'eggBtn';
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; cv.style.filter = `hue-rotate(${h}deg)`;
    const draw = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(egg, 0, 0, 16, 16, 0, 0, 16, 16); };
    if (egg.complete) draw(); else egg.addEventListener('load', draw);
    b.appendChild(cv); b.onclick = () => chooseEgg(i); row.appendChild(b);
  });
  $('eggChoice').classList.remove('hidden');
}
function chooseEgg(i, fam = null) {
  $('eggChoice').classList.add('hidden'); sfx('ui_click_01.ogg');
  const babies = CHARS.baby;
  pet = { v: 2, stage: 0, egg: i, sprite: babies[(i * 3 + Math.floor(Math.random() * 3)) % babies.length], progress: 0, eggTaps: 0, cares: 0, stats: {}, itemCounts: {}, seenCats: [], born: null, name: '', gen: fam ? fam.gen : 1, parent: fam ? fam.parent : null };
  view.x = view.tx = 48;
  save(); updateTop();
  $('tapEgg').classList.remove('hidden');
}
let eggBusy = false;
async function tapEgg() {
  if (eggBusy) return;
  eggBusy = true;
  pet.eggTaps++; view.wobble = 1; sfx('jump.ogg', .4); await sleep(350); view.wobble = 0;
  if (pet.eggTaps >= 5) {
    $('tapEgg').classList.add('hidden');
    view.wobble = 1; await sleep(900); view.wobble = 0;
    view.flash = 1; await sleep(400);
    pet.stage = 1; pet.progress = 0; pet.born = new Date().toISOString();
    await sleep(600); view.flash = 0;
    sfx('cheer_success.ogg'); burst('twinkle', 5);
    save(); updateTop();
    await hop(2, 4);
    askName();
  }
  eggBusy = false;
}
function askName() {
  busy = true;
  $('nameInput').value = '';
  $('nameCard').classList.remove('hidden'); setTimeout(() => $('nameInput').focus(), 50);
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
  await say(`My name is ${v}! Nice to meet you!`, 2200);
  if (pet.parent) await say(`I'm ${pet.parent}'s baby!`, 2200);
  await say(`My birthday is ${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()}.`, 2400);
  hideBubble(); busy = false;
  pet.wishes = 3; pet.wishAt = Date.now(); pet.lastSeen = Date.now(); save(); noteVisit();
  buildCats(); setCatsEnabled(true); updateTop();
  scheduleNeed(1500);
};

function save() { if (pet) store(SAVE_KEY, pet); }

// ---------------------------------------------------------------- shop
let shopTab = 'acc';
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { shopTab = b.dataset.tab; renderShop(); });
function renderShop() {
  $('shopStars').textContent = shop.stars;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  const g = $('shopGrid'); g.innerHTML = '';
  const T = {
    acc: { list: ACCS, owned: shop.acc, key: 'wearing', verb: 'Wear', toggle: true },
    room: { list: ROOMS, owned: shop.rooms, key: 'room', verb: 'Use' },
    shell: { list: SHELLS, owned: shop.shells, key: 'shell', verb: 'Use' },
  }[shopTab];
  for (const it of T.list) {
    const owned = T.owned.includes(it.id) || it.price === 0;
    const on = shop[T.key] === it.id;
    const d = document.createElement('button');
    d.className = 'sitem' + (owned ? ' owned' : '') + (on ? ' on' : '') + (!owned && shop.stars < it.price ? ' cant' : '');
    if (shopTab === 'acc') {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; d.appendChild(cv);
      const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const draw = () => {
        c.clearRect(0, 0, 64, 64);
        const has = pet && pet.stage > 0, cs = has ? cell() : 32;
        const r = { x: 32 - cs / 2, y: 50 - cs, w: cs, h: cs }, sp = has ? pet.sprite : null;
        if (!it.front) drawAcc(c, it.id, 1, has ? r : { x: 16, y: 16, w: 32, h: 32 }, false, sp);
        if (has) drawCell(c, img(charSrc(pet.sprite)), 1, cs, r.x, r.y, false);
        if (it.front) drawAcc(c, it.id, 1, has ? r : { x: 16, y: 16, w: 32, h: 32 }, false, sp);
      };
      const im = img(`assets/acc/${it.id}.png`); if (im.complete) draw(); else im.addEventListener('load', draw);
    } else if (shopTab === 'room') {
      const t = document.createElement('div'); t.className = 'thumb'; t.style.backgroundImage = `url(${bgSrc(it.id)})`; d.appendChild(t);
    } else {
      const t = document.createElement('div'); t.className = 'shellthumb'; t.style.backgroundImage = `url(assets/ui/${it.id}.jpg)`; d.appendChild(t);
    }
    d.insertAdjacentHTML('beforeend', `<div>${it.en}</div><div class="price">${on ? '✔ ON' : owned ? T.verb : '⭐ ' + it.price}</div>`);
    d.onclick = () => {
      if (owned) shop[T.key] = on && T.toggle ? null : it.id;
      else if (shop.stars >= it.price) { shop.stars -= it.price; T.owned.push(it.id); shop[T.key] = it.id; sfx('task_complete.ogg'); count('bought'); }
      else { sfx('refuse.ogg', .4); return; }
      if (shopTab === 'room' && !place) homeBg();
      if (shopTab === 'shell') applyShell();
      store(SHOP_KEY, shop); updateTop(); renderShop();
    };
    g.appendChild(d);
  }
}
function applyShell() { $('app').style.setProperty('--shell-img', `url(assets/ui/${shop.shell || 'shell_13'}.jpg)`); }
$('shopBtn').onclick = () => { renderShop(); openModal('shop'); };

// ---------------------------------------------------------------- diary book (diary / letters / badges)
let diaryTab = 'goals';
document.querySelectorAll('#diaryTabs button').forEach(b => b.onclick = () => { diaryTab = b.dataset.tab; renderDiary(); });
function niceDate(d) { const [y, m, dd] = d.split('-').map(Number); return `${MONTHS[m - 1]} ${dd}`; }
function renderDiary() {
  document.querySelectorAll('#diaryTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === diaryTab));
  const box = $('diaryList');
  if (diaryTab === 'diary') {
    const days = (pet && pet.diary || []).slice().reverse();
    box.innerHTML = days.length ? days.map(d => `<div class="page"><h4>${niceDate(d.d)}</h4>${d.lines.map(l => `<p>${l}</p>`).join('')}<p class="end">It was a good day!</p></div>`).join('') : '<div class="empty">No diary yet.</div>';
  } else if (diaryTab === 'letters') {
    box.innerHTML = world.letters.length ? world.letters.map(l => `<div class="page letterp"><h4>${niceDate(l.d)}</h4><p>Dear ${pet ? pet.name : 'friend'},</p><p>${l.text}</p><p class="end">From, ${l.from}</p></div>`).join('') : '<div class="empty">No letters yet.</div>';
  } else {
    box.innerHTML = '<div class="badges">' + BADGES.map(b => `<div class="badge ${world.badges.includes(b.id) ? 'got' : ''}"><span>${world.badges.includes(b.id) ? b.e : '🔒'}</span><b>${b.en}</b></div>`).join('') + '</div>';
  }
}
$('diaryBtn').onclick = () => { renderDiary(); openModal('diaryBook'); };

// ---------------------------------------------------------------- album
$('albumBtn').onclick = () => {
  const list = $('albumList'); list.innerHTML = '';
  const alb = load(ALB_KEY, []);
  if (!alb.length) list.innerHTML = '<div class="empty">No pets yet.</div>';
  for (const e of alb) {
    const d = document.createElement('div'); d.className = 'alb';
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; d.appendChild(cv);
    if (e.sprite) { const im = img(charSrc(e.sprite)); const draw = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; drawCell(c, im, 2, im.naturalWidth / 4, (32 - im.naturalWidth / 4) / 2, 32 - im.naturalWidth / 4, false); }; if (im.complete) draw(); else im.addEventListener('load', draw); }
    const born = e.born ? new Date(e.born).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    d.insertAdjacentHTML('beforeend', `<b>${e.name}</b>${e.gen > 1 ? `<i class="gen">Gen ${e.gen} · ${e.parent}'s child</i>` : ''}⭐ ${e.stars || 0} · 💗 ${e.cares || 0}<br><small>Born ${born}${e.reset ? ' · (reset)' : ''}</small>`);
    list.appendChild(d);
  }
  openModal('album');
};

// ---------------------------------------------------------------- view toggle (normal / tamagotchi)
function applyView() {
  const tama = settings.view === 'tama';
  $('app').classList.toggle('tama', tama);
  FEET = tama ? 80 : 88;
  $('viewIc').textContent = tama ? '🖥️' : '🥚';
  $('viewLb').textContent = tama ? 'Big view' : 'Tama view';
}
$('viewBtn').onclick = () => { settings.view = settings.view === 'tama' ? 'normal' : 'tama'; store(SET_KEY, settings); applyView(); sfx('shell_button_up.ogg', .5); };
$('soundBtn').onclick = () => { settings.sound = window.soundOn = !settings.sound; store(SET_KEY, settings); $('soundBtn').textContent = settings.sound ? '🔔' : '🔕'; };

function openModal(id) { $('modalBack').classList.remove('hidden'); document.querySelectorAll('.modal').forEach(m => m.classList.toggle('hidden', m.id !== id)); }
function closeModal() { $('modalBack').classList.add('hidden'); }
document.querySelectorAll('.closeModal').forEach(b => b.onclick = closeModal);
$('modalBack').addEventListener('pointerdown', e => { if (e.target === $('modalBack')) closeModal(); });
// ---------------------------------------------------------------- boot
function boot() {
  applyView(); applyShell(); homeBg();
  $('soundBtn').textContent = settings.sound ? '🔔' : '🔕';
  requestAnimationFrame(render);
  if (!pet) { startChoice(); return; }
  view.x = view.tx = 48;
  updateTop(); buildCats();
  if (pet.stage === 0) { $('tapEgg').classList.remove('hidden'); setCatsEnabled(false); return; }
  if (!pet.name) { askName(); return; }
  if (!pet.lastSeen) pet.lastSeen = Date.now() - 11 * MIN;
  if (pet.wishes === undefined) { pet.wishes = 3; pet.wishAt = Date.now(); }
  setTimeout(welcomeBack, 500);
}
window.addEventListener('DOMContentLoaded', boot); // after activities.js has loaded
