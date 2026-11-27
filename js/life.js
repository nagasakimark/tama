// ============================================================
//  Tama Talk – everyday life & touch interactions (like Tamaweb)
//  rub to pet, bath, teeth, toilet, poop, day & night, weather,
//  chatter, want bubble, wandering, cupboard, crafting, selling,
//  moving furniture, seeds & flowers, camera, collection, family
//  tree, traits, playdates, phone calls, birthday party, island
//  fruit game, picture puzzle.  Simple English only.
// ============================================================

// ================================================================ "how to touch" hint (original tap-pointer art)
let hintEl = null;
function showHint(kind, x = 48, y = 50, label) {
  hideHint();
  const words = { rub: 'Rub!', tap: 'Tap!', move: 'Move!', hold: 'Hold!' };
  hintEl = h(`<div class="thint ${kind}" style="left:${x / 96 * 100}%;top:${y / 96 * 100}%"><i></i><b>${label || words[kind]}</b></div>`);
  $('screen').appendChild(hintEl);
}
function hideHint() { if (hintEl) { hintEl.remove(); hintEl = null; } }
// any panel that asks for a touch on the screen shows the hand automatically
const _panel = panel;
panel = function (title, html = '') {
  const r = _panel(title, html);
  if (/on the screen/.test(html)) {
    const kind = /Rub/.test(html) ? 'rub' : /Move|Hold/.test(html) ? 'move' : 'tap';
    showHint(kind, 48, kind === 'move' ? 70 : 55);
  } else if (!/Rub|Tap|Move/.test(html)) hideHint();
  return r;
};
$('screen').addEventListener('pointerdown', () => { if (hintEl && !hintEl.classList.contains('stay')) hideHint(); });
const _endScene = endScene;
endScene = function () { hideHint(); _endScene(); };

// rubbing: call fn on each "rub" step while the finger moves on a target
function rubber(isOn) {
  let last = null, dist = 0;
  return (x, y) => {
    if (!window.pointerHeld || !isOn(x, y)) { last = null; return 0; }
    if (last) dist += Math.hypot(x - last[0], y - last[1]);
    last = [x, y];
    if (dist > 5) { dist = 0; return 1; }
    return 0;
  };
}
function onPet(x, y, pad = 4) { const r = petRect(); return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }

// ================================================================ CARE WITH TOUCH (replaces the instant versions)
async function rubToPet() {
  talk('Rub me, please!');
  panel('🤗 Hug', '<div class="ahelp">👆 Rub your pet on the screen</div>');
  showHint('rub', view.x, petRect().y + 8); hintEl.classList.add('stay');
  let n = 0; const rub = rubber(onPet);
  await new Promise(res => scene(place || shop.room || 'home_03', {
    draw(c, t) { if (!place) drawDecor(c, t); drawMe(c, t, n ? meCell(t) : 1); },
    move(x, y) { if (rub(x, y)) { n++; hideHint(); setAnim('blush', 600); if (n % 2) burst('heart', 1); sfx('blush.ogg', .15); if (n >= 14) res(); } },
  }));
  setAnim('cheer', 1200); burst('heart', 6); sfx('cute.ogg');
  talk(rnd(THANKS.hug)); await sleep(1500);
}
async function bathTime(it) {
  const shower = it.id === 'shower';
  const foams = [];
  view.x = view.tx = 61; let rinse = 0, bathPos = { x: 41, y: 41, w: 32, h: 32 };
  talk(shower ? "Let's take a shower!" : "Let's take a bath!");
  panel(shower ? '🚿 Shower' : '🛁 Bath', '<div class="ahelp">👆 Rub your pet on the screen</div>');
  showHint('rub', 57, 50); hintEl.classList.add('stay');
  const rub = rubber((x, y) => x > bathPos.x - 4 && x < bathPos.x + bathPos.w + 4 && y > bathPos.y - 4 && y < bathPos.y + bathPos.h);
  await new Promise(res => scene('bathroom', {
    draw(c, t) {
      const cs = petRect().w, rr = { x: Math.round(.64 * (96 - cs)), y: Math.round(.64 * (96 - cs)), w: cs, h: cs };
      bathPos = rr;
      drawCell(c, img(charSrc(pet.sprite)), foams.length ? 2 : 1, cs, rr.x, rr.y, false);
      foams.forEach(f => { const im = img('assets/misc/foam_single.png'); if (im.complete) c.drawImage(im, f.x + Math.sin(t / 200 + f.p) * .8, f.y + Math.cos(t / 260 + f.p) * .8, f.s, f.s); });
      const bg = img(bgSrc('bathroom')); if (bg.complete) { c.save(); c.beginPath(); c.rect(38, 51, 43, 17); c.clip(); c.drawImage(bg, 0, 0); c.restore(); }
      if (rinse) for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(120,200,255,.8)'; c.fillRect(48 + i * 4, ((t / 3) + i * 13) % 40 + 20, 1, 4); }
    },
    move(x, y) {
      if (!rub(x, y + 0)) return;
      hideHint(); const r = bathPos;
      foams.push({ x: r.x + r.w / 2 - 6 + (Math.random() - .5) * r.w * .8, y: r.y + r.h * .25 + (Math.random() - .5) * r.h * .4, s: 8 + Math.random() * 5, p: Math.random() * 6 });
      sfx('pop_01.mp3', .2);
      if (foams.length >= 10) res();
    },
    tap(x, y) { if (Math.abs(x - view.x) < 16) showHint('rub', view.x, 52); },
  }));
  talk('Bubbles! Now, rinse!'); rinse = 1; sfx('swoosh_01.ogg', .4);
  for (let i = 0; i < 10; i++) { foams.pop(); await sleep(140); }
  rinse = 0; burst('twinkle', 4); sfx('cheer.ogg', .4);
  talk(rnd(THANKS.clean)); await sleep(1500);
}
async function teethTime() {
  view.x = view.tx = 48; let n = 0, bx = 48;
  talk("Let's brush my teeth!");
  panel('🪥 Brush teeth', '<div class="ahelp">👆 Rub the toothbrush on the screen</div>');
  const rub = rubber((x, y) => Math.abs(x - 48) < 20);
  await new Promise(res => scene('bathroom', {
    draw(c, t) {
      drawMe(c, t, 3);
      const r = petRect(), my = r.y + r.h * .62;
      const tb = img('assets/misc/toothbrush_01.png'); if (tb.complete) c.drawImage(tb, bx - 2, my - 7, 14, 14);
    },
    move(x, y) { if (rub(x, y)) { hideHint(); n++; bx = 48 + (n % 2 ? 3 : -3); if (n % 2) { const r = petRect(); particles.push({ src: 'assets/misc/foam_single.png', x: 48 + (Math.random() - .5) * 8, y: r.y + r.h * .62, vx: (Math.random() - .5) * .5, vy: -.2, s: 5, life: 40 }); sfx('pop_01.mp3', .15); } if (n >= 16) res(); } },
  }));
  setAnim('cheer', 1200); burst('twinkle', 4); talk('Shiny teeth! Thank you!'); await sleep(1500);
}
async function handsTime() {
  view.x = view.tx = 48; let n = 0;
  talk("Let's wash my hands!");
  panel('🧼 Wash hands', '<div class="ahelp">👆 Rub your pet on the screen</div>');
  const rub = rubber(onPet);
  await new Promise(res => scene('bathroom', {
    draw(c, t) { drawMe(c, t, n ? 2 : 1); },
    move(x, y) { if (rub(x, y)) { hideHint(); n++; burst('foam', 1); if (n >= 8) res(); } },
  }));
  burst('twinkle', 3); talk('Clean hands! Thank you!'); await sleep(1400);
}
async function toiletTime() {
  view.x = view.tx = 17;
  talk('Toilet time!'); panel('🚽 Toilet', '');
  scene('bathroom', { draw(c, t) { const r = petRect(); drawCell(c, img(charSrc(pet.sprite)), animCell('sit', t), r.w, Math.round(17 - r.w / 2), 80 - r.w, false); } });
  setAnim('sit', 2200); await sleep(1600);
  const box = panel('🚽 Toilet', '<div class="ahelp">Flush the toilet!</div>');
  const b = h('<button class="big">Flush! 🌊</button>'); box.appendChild(b); await wait(b);
  sfx('swoosh_01.ogg', .5); burst('twinkle', 3); talk('Thank you!'); await sleep(1200);
}
async function poopTap() {
  talk('Oops! Tap the poop to clean it!');
  panel('🧹 Clean up', '<div class="ahelp">👆 Tap the poop on the screen</div>');
  showHint('tap', 77, FEET - 34); hintEl.classList.add('stay');
  await new Promise(res => scene(shop.room || 'home_03', {
    draw(c, t) { drawDecor(c, t); const p = img('assets/misc/poop.png'); if (p.complete) c.drawImage(p, 70, FEET - 14); drawMe(c, t, meCell(t)); },
    tap(x, y) { if (Math.abs(x - 77) < 10 && Math.abs(y - (FEET - 7)) < 12) res(); },
  }));
  hideHint(); pet.poop = false; burst('twinkle', 4); sfx('pop_01.mp3'); talk(rnd(THANKS.cleanup)); await sleep(1300);
}
const CARE = { hug: rubToPet, bath: bathTime, shower: bathTime, teeth: teethTime, hands: handsTime, toilet: toiletTime, cleanup: poopTap };
const _success = success;
success = async function (it, fromRect) {
  if (!CARE[it.id]) return _success(it, fromRect);
  const firstTry = need.tries === 0, wasBirthday = need.birthday;
  glowCats(false); hideBubble(); closeTray();
  await CARE[it.id](it);
  endScene(); homeBg(); view.x = view.tx = 48; view.anim = null;
  await completeWish({ firstTry, stars: firstTry ? 2 : 1, itemId: it.id, diary: pastLine(it) || 'I went to the toilet.', birthday: wasBirthday });
};
// tapping the poop at home (no wish needed) also cleans it
window.homeDown = (x, y) => {
  if (!pet || busy || pet.stage === 0) return false;
  if (asleep) { talk('Zzz… I\'m sleeping. Good night!'); setTimeout(hideBubble, 1500); return true; }
  if (pet.poop && Math.abs(x - 77) < 10 && Math.abs(y - (FEET - 7)) < 12 && !place) {
    if (need && need.ok.includes('cleanup')) { give(ITEM.cleanup, null); return true; }
    pet.poop = false; save(); burst('twinkle', 3); sfx('pop_01.mp3'); return true;
  }
  if (onPet(x, y)) { homeRubbing = 0; return !(need && need.ok.includes('hug')) ? true : false; }
  return false;
};
// rubbing the pet at home any time: blush and hearts (like the original "pet")
let homeRubbing = 0; const homeRub = rubber(onPet);
window.homeMove = (x, y) => {
  if (!pet || busy || pet.stage === 0 || place || asleep) return;
  if (homeRub(x, y)) { homeRubbing++; setAnim('blush', 700); if (homeRubbing % 3 === 0) { burst('heart', 1); sfx('blush.ogg', .12); } }
};

// ================================================================ DAY, NIGHT & WEATHER
const isNight = () => { const h = (window.__testHour ?? new Date().getHours()); return h >= 20 || h < 6; };
function weatherToday() {
  const d = new Date(), m = d.getMonth() + 1, seed = d.getFullYear() * 400 + m * 31 + d.getDate();
  const r = (Math.sin(seed) + 1) / 2;
  if ((m === 12 || m <= 2) && r < .35) return 'snow';
  if (r < .3) return 'rain';
  return null;
}
window.asleep = false;
// windows: room, then weather, then sky behind
const _setBg = setBg;
setBg = function (id) {
  _setBg(id);
  const w = weatherToday(), layers = $('bgLayer').style.backgroundImage.split(/,\s*(?=url)/);
  const sky = isNight() ? 'url(assets/bg/sky_night.png)' : layers[1];
  $('bgLayer').style.backgroundImage = [layers[0], w ? `url(assets/bg/${w}_01.png)` : null, sky].filter(Boolean).join(', ');
  window.curBg = id;
};
function drawWeatherOutside(c, t) {
  const w = weatherToday(); if (!w || !window.actScene || !/park|street|garden|beach|grass|stand|island/.test(window.curBg || '')) return;
  const im = img(`assets/bg/${w}_01.png`); if (!im.complete) return;
  c.globalAlpha = .8; c.drawImage(im, 0, (t / (w === 'rain' ? 6 : 30)) % 96 - 96); c.drawImage(im, 0, (t / (w === 'rain' ? 6 : 30)) % 96); c.globalAlpha = 1;
}
async function goToBed() {
  window.asleep = true; pet.asleepAt = Date.now(); save();
  clearTimeout(needTimer); need = null; hideBubble();
  $('nightLayer').classList.remove('hidden'); setAnim('sleep', 1e9);
}
function wakeUp() { window.asleep = false; $('nightLayer').classList.add('hidden'); view.anim = null; delete pet.asleepAt; save(); }
// at bedtime the pet asks for sleep; at night, wishes stop until morning
setInterval(() => {
  if (!pet || pet.stage === 0 || !pet.name || busy) return;
  if (isNight() && !asleep && !need && !window.actScene) { need = { key: 'bedtime', en: `It's night. I'm sleepy. Good night!`, ok: ['bed'], tries: 0 }; showNeedBubble(); }
  if (!isNight() && asleep) { wakeUp(); talk('Good morning!'); setTimeout(hideBubble, 1800); scheduleNeed(1500); }
}, 5000);
const _newNeed = newNeed;
newNeed = async function () { if (asleep || (isNight() && pet && pet.stage > 0)) return; return _newNeed(); };
// sleeping at night = sleep until morning
const _completeWish = completeWish;
completeWish = async function (o) {
  const wasBed = need && need.key === 'bedtime';
  if (wasBed) { need = null; hideBubble(); save(); await goToBed(); finishBusy(); return; }
  return _completeWish(o);
};
const _successSleep = success;
success = async function (it, fromRect) {
  if (need && need.key === 'bedtime' && it.id === 'bed') {
    glowCats(false); hideBubble();
    talk('Good night!'); $('nightLayer').classList.remove('hidden'); setAnim('sleep', 1e9); await sleep(1500); hideBubble();
    need = null; pet.wishes = pet.wishes; await goToBed(); return;
  }
  return _successSleep(it, fromRect);
};

// ================================================================ WANT BUBBLE, CHATTER, WANDERING (drawn after the pet)
const CHAT = {
  any: ['Hello!', 'I\'m happy!', 'La la la!', 'I like you!', 'What time is it?'],
  morning: ['Good morning!'], afternoon: ['Good afternoon!'], evening: ['Good evening!'],
  rain: ['It\'s rainy today.', 'I like the rain!'], snow: ['It\'s snowy!', 'I like snow!'], sun: ['It\'s sunny!'],
  active: ['Let\'s play!', 'I can run fast!'], hungry: ['I like food!', 'Yummy, yummy!'], sleepy: ['I like sleeping.', 'Yawn…'],
  smart: ['I like books!', 'One, two, three!'], friendly: ['Let\'s be friends!', 'I like hugs!'], shy: ['Um… hello.', '…'],
};
let chatText = null, chatUntil = 0, nextChat = performance.now() + 15000;
window.afterPet = (c, t) => {
  if (!pet || pet.stage === 0) return;
  const r = petRect();
  // want bubble: a "?" (we don't show the answer – the English is the clue)
  if (need && !busy && !window.actScene) {
    const bob = Math.sin(t / 250) * 1.5;
    drawPic(c, 'misc/thought_bubble_01', r.x + r.w - 6, r.y - 22 + bob);
    const icon = need.activity ? 'misc/exclam_01' : 'misc/thought_question';
    const im = img(`assets/${icon}.png`); if (im.complete) c.drawImage(im, r.x + r.w - 2, r.y - 19 + bob, 16, 16);
  }
  // chatter
  if (!need && !busy && !asleep && !place && t > nextChat) {
    const h = new Date().getHours(), w = weatherToday();
    const pool = [...CHAT.any, ...(CHAT[h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening']), ...(w ? CHAT[w] : CHAT.sun), ...(CHAT[pet.trait] || [])];
    if (world.animal) pool.push(`I like ${world.animal.name}!`);
    if (world.toys.length) pool.push(`I like my ${TOYS.find(x => x.id === world.toys[world.toys.length - 1])?.en || 'toys'}!`);
    chatText = rnd(pool); chatUntil = t + 2600; nextChat = t + 20000 + Math.random() * 25000;
  }
  if (t < chatUntil && chatText && !need) setChat(chatText, r); else setChat(null);
  if (asleep && Math.floor(t / 700) % 2 === 0 && Math.random() < .03) burst('z', 1);
};
let chatEl = null;
function setChat(text, r) {
  if (!text) { if (chatEl) { chatEl.remove(); chatEl = null; } return; }
  if (!chatEl) { chatEl = h('<div class="chat"></div>'); $('screen').appendChild(chatEl); }
  chatEl.textContent = text;
  chatEl.style.left = (r.x + r.w / 2) / 96 * 100 + '%'; chatEl.style.top = (r.y - 2) / 96 * 100 + '%';
}
window.afterAll = (c, t) => { drawWeatherOutside(c, t); };
// wandering: sit on a sofa, play with a toy or the cat/dog
const SOFAS = { sofa_peachy: 12, sofa_blue: 12, sofa_pink: 12, chair_orange: 12, race_car_minibed: 8 };
let sitting = null;
window.idleTarget = t => {
  if (sitting) { view.float = 0; sitting = null; }
  if (Math.random() > .35) return false;
  const opts = [];
  (shop.furn || []).forEach((id, i) => { if (id && SOFAS[id] && FURNISHABLE.includes(shop.room || 'home_03')) opts.push(['sit', furnX(id, i) + picSize('furn/' + id)[0] / 2, SOFAS[id]]); });
  if (world.toys.length) opts.push(['toy', 10 + Math.random() * 20]);
  if (world.animal) opts.push(['animal', pal.x + 10]);
  if (!opts.length) return false;
  const [kind, x, seat] = rnd(opts);
  view.tx = Math.max(14, Math.min(82, x));
  const wait = Math.abs(view.tx - view.x) / .22 * 16 + 200;
  view.walkPause = t + wait + 3500;
  setTimeout(() => {
    if (busy || need) return;
    if (kind === 'sit') { sitting = true; view.float = seat; setAnim('sit', 3300); }
    else { setAnim('cheer', 1500); burst('heart', 2); }
  }, wait);
  return true;
};

// ================================================================ FURNITURE: move it anywhere (like the original's arrows)
shop.furnX = shop.furnX || {};
function furnX(id, i) { return shop.furnX[id] ?? Math.min(96 - picSize('furn/' + id)[0], SLOTS[i]); }
drawFurniture = function (c) {
  if (!FURNISHABLE.includes(shop.room || 'home_03')) return;
  (shop.furn || []).forEach((id, i) => { if (!id) return; const [w, hh] = picSize('furn/' + id); if (editing === id && Math.floor(performance.now() / 250) % 2) return; drawPic(c, 'furn/' + id, furnX(id, i), FEET - hh + 2); });
};
let editing = null;
async function moveFurniture(id) {
  closeModal(); editing = id; busy = true; setCatsEnabled(false); clearTimeout(needTimer);
  const box = panel('🛋️ Move it', '<div class="ahelp">◀ ▶ Move, then ✔</div>');
  const row = h('<div class="arrows"><button class="abtn txt arr">◀</button><button class="big">✔ OK</button><button class="abtn txt arr">▶</button></div>'); box.appendChild(row);
  const [l, ok, r] = row.querySelectorAll('button'), i = shop.furn.indexOf(id), w = picSize('furn/' + id)[0];
  const step = d => { shop.furnX[id] = Math.max(0, Math.min(96 - w, furnX(id, i) + d)); };
  let hold = null; [[l, -2], [r, 2]].forEach(([b, d]) => { b.onpointerdown = () => { step(d); hold = setInterval(() => step(d), 80); }; b.onpointerup = b.onpointerleave = () => clearInterval(hold); });
  await wait(ok); clearInterval(hold);
  editing = null; store(SHOP_KEY, shop); panelClose(); finishBusy(); scheduleNeed(1500);
}

// ================================================================ CUPBOARD (food you collect), MAKE (crafting), SELL
const CUP = { // id: [sheet, sprite, English]
  banana: ['food', 960, 'banana'], bread: ['food', 542, 'bread'], milk: ['food', 1036, 'milk'], juice: ['food', 905, 'orange juice'],
  riceball: ['food', 800, 'rice ball'], cake: ['food', 998, 'cake'], icecream: ['food', 1024, 'ice cream'], sushi: ['food', 605, 'sushi'],
  pizza: ['food', 515, 'pizza'], salad: ['food', 323, 'salad'], candy: ['food', 1033, 'candy'], cookie: ['food', 1001, 'cookie'],
  tomato: ['plant', 35, 'tomato'], carrot: ['plant', 43, 'carrot'], potato: ['plant', 47, 'potato'], sweetpotato: ['plant', 51, 'sweet potato'],
  watermelon: ['plant', 55, 'watermelon'], peach: ['plant', 59, 'peach'], cabbage: ['plant', 31, 'cabbage'],
  redtulip: ['plant', 27, 'red tulip'], yellowtulip: ['plant', 19, 'yellow tulip'], bluetulip: ['plant', 11, 'blue tulip'],
  fruitsalad: ['food', 803, 'fruit salad'], soup: ['food', 463, 'vegetable soup'], veggiesalad: ['food', 617, 'salad'], pie: ['food', 773, 'pie'],
};
world.cupboard = world.cupboard || { banana: 1, milk: 1 };
function addCup(id, n = 1) { if (!CUP[id]) return; world.cupboard[id] = (world.cupboard[id] || 0) + n; saveWorld(); }
const RECIPES2 = [
  { make: 'fruitsalad', need: { banana: 1, peach: 1, watermelon: 1 } },
  { make: 'soup', need: { carrot: 1, potato: 1, tomato: 1 } },
  { make: 'veggiesalad', need: { cabbage: 1, tomato: 1 } },
  { make: 'pie', need: { peach: 1, milk: 1 } },
  { make: 'bouquet', acc: 'bouquet_01', need: { redtulip: 1, yellowtulip: 1, bluetulip: 1 } },
];
let cupTab = 'eat';
function renderCupboard() {
  document.querySelectorAll('#cupTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === cupTab));
  const g = $('cupGrid'); g.innerHTML = '';
  const have = Object.entries(world.cupboard).filter(([, n]) => n > 0);
  if (cupTab === 'make') {
    RECIPES2.forEach(r => {
      const can = Object.entries(r.need).every(([k, n]) => (world.cupboard[k] || 0) >= n);
      const out = r.acc ? `<b>flowers</b>` : `<b>${CUP[r.make][2]}</b>`;
      const d = h(`<div class="recipe ${can ? '' : 'cant'}"><div class="rin"></div><span class="eq">=</span><div class="rout"></div><button class="big">Make!</button></div>`);
      Object.keys(r.need).forEach((k, i) => { if (i) d.querySelector('.rin').appendChild(h('<span class="plus">+</span>')); const s = h(`<span class="ing"><b>${CUP[k][2]}</b></span>`); s.prepend(icon(CUP[k][0], CUP[k][1], 40)); d.querySelector('.rin').appendChild(s); });
      const o = h(`<span class="ing">${out}</span>`); o.prepend(r.acc ? picIcon('acc/bouquet_01', 40) : icon(CUP[r.make][0], CUP[r.make][1], 40)); d.querySelector('.rout').appendChild(o);
      d.querySelector('button').onclick = () => {
        if (!can) { sfx('refuse.ogg', .4); return; }
        Object.entries(r.need).forEach(([k, n]) => world.cupboard[k] -= n);
        if (r.acc) { if (!shop.acc.includes(r.acc)) shop.acc.push(r.acc); store(SHOP_KEY, shop); } else addCup(r.make);
        saveWorld(); sfx('cheer_success.ogg', .5); toast(`You made ${r.acc ? 'flowers' : CUP[r.make][2]}!`); renderCupboard();
      };
      g.appendChild(d);
    });
    return;
  }
  if (!have.length) { g.innerHTML = '<div class="empty">The cupboard is empty. Buy food at the market or pick vegetables in the garden!</div>'; return; }
  have.forEach(([k, n]) => {
    const d = h(`<button class="sitem"><div class="fthumb"></div><div>${CUP[k][2]}</div><div class="price">${cupTab === 'sell' ? 'Sell: ⭐ 2' : '× ' + n}</div></button>`);
    d.querySelector('.fthumb').appendChild(icon(CUP[k][0], CUP[k][1], 64));
    d.onclick = () => {
      if (cupTab === 'sell') { world.cupboard[k]--; shop.stars += 2; store(SHOP_KEY, shop); saveWorld(); updateTop(); sfx('task_complete.ogg', .4); renderCupboard(); return; }
      if (/tulip/.test(k)) { sfx('refuse.ogg', .4); toast("You can't eat flowers! Make flowers in 'Make'."); return; }
      closeModal(); snack(k);
    };
    g.appendChild(d);
  });
}
async function snack(k) {
  if (!pet || pet.stage === 0 || busy) return;
  const d = dayKey(); world.snacks = world.snacks && world.snacks.d === d ? world.snacks : { d, n: 0 };
  busy = true; setCatsEnabled(false);
  if (world.snacks.n >= 3) { setAnim('refuse', 1200); await say("I'm full! No more snacks today.", 1800, 'refuse'); }
  else {
    world.cupboard[k]--; world.snacks.n++; saveWorld();
    setAnim('eat', 1400); sfx('eat.ogg'); await sleep(1400); burst('heart', 3);
    await say(`Yummy ${CUP[k][2]}! Thank you!`, 1700);
  }
  hideBubble(); finishBusy(); if (need) showNeedBubble();
}
document.querySelectorAll('#cupTabs button').forEach(b => b.onclick = () => { cupTab = b.dataset.tab; renderCupboard(); });
$('cupBtn').onclick = () => { renderCupboard(); openModal('cupboard'); };
// sources: market, garden, friends, trick-or-treat
const _shopping = shopping;
shopping = async function () { const before = JSON.stringify(world.cupboard); const r = await _shopping(); (r.diary.match(/bought (?:an? )?(.+?) and (?:an? )?(.+?)\./) || []).slice(1).forEach(w => { const k = Object.keys(CUP).find(k => CUP[k][2] === w || ITEM[k]?.en === w); if (k) addCup(k); }); return r; };
const _trick = trickOrTreat;
trickOrTreat = async function () { const r = await _trick(); addCup('candy', 2); return r; };

// ================================================================ SEEDS & FLOWERS (seed packs in the shop, flowers in the garden)
CROPS.push({ id: 'redtulip', one: 'red tulip', spr: 25, pl: 'red tulips' }, { id: 'yellowtulip', one: 'yellow tulip', spr: 17, pl: 'yellow tulips' }, { id: 'bluetulip', one: 'blue tulip', spr: 9, pl: 'blue tulips' });
world.seeds = world.seeds || { tomato: 2, carrot: 2, redtulip: 1 };
const _gardenMode = gardenMode;
gardenMode = function () {
  const m = _gardenMode();
  if (m === 'plant' && !Object.values(world.seeds).some(n => n > 0)) return null;
  return m;
};
// planting uses seeds you have; picking puts the vegetables in the cupboard
const _garden = garden;
garden = async function () {
  const before = world.garden.map(p => p && p.id);
  const r = await _garden();
  world.garden.forEach((p, i) => { if (p && !before[i]) world.seeds[p.id] = Math.max(0, (world.seeds[p.id] || 0) - 1); });
  before.forEach((id, i) => { if (id && !world.garden[i]) addCup(id, /tulip/.test(id) ? 1 : 2); });
  saveWorld(); return r;
};
const SEED_SHOP = CROPS.map(c => ({ id: c.id, en: `${c.one} seeds`, price: /tulip/.test(c.id) ? 8 : 5 }));

// ================================================================ CAMERA, COLLECTION, FAMILY TREE
async function takePhoto() {
  if (!pet || pet.stage === 0) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  const srcs = ($('bgLayer').style.backgroundImage.match(/url\(["']?([^"')]+)/g) || []).map(s => s.replace(/url\(["']?/, '')).reverse();
  for (const s of srcs) { const im = img(s); if (im.complete) c.drawImage(im, 0, 0, 96, 96); }
  c.drawImage($('pet'), 0, 0); c.drawImage($('fxc'), 0, 0);
  const flash = h('<div class="flash"></div>'); $('screen').appendChild(flash); setTimeout(() => flash.remove(), 400);
  sfx('shell_button_down.ogg', .6); setAnim('cheer', 1200);
  world.photos = world.photos || []; world.photos.unshift({ d: dayKey(), name: pet.name, src: cv.toDataURL('image/png') }); world.photos = world.photos.slice(0, 12);
  saveWorld(); toast('📷 Photo saved in the album!');
}
$('camBtn').onclick = takePhoto;
setInterval(() => { if (pet && pet.sprite) { world.seen = world.seen || []; if (!world.seen.includes(pet.sprite)) { world.seen.push(pet.sprite); saveWorld(); } } }, 3000);
let albumTab = 'pets';
document.querySelectorAll('#albumTabs button').forEach(b => b.onclick = () => { albumTab = b.dataset.tab; renderAlbumTab(); });
const _albumOpen = $('albumBtn').onclick;
$('albumBtn').onclick = () => { _albumOpen(); albumTab = 'pets'; renderAlbumTab(); };
function renderAlbumTab() {
  document.querySelectorAll('#albumTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === albumTab));
  if (albumTab === 'pets') { _albumOpen(); return; }
  const list = $('albumList'); list.innerHTML = '';
  if (albumTab === 'photos') {
    if (!(world.photos || []).length) list.innerHTML = '<div class="empty">No photos yet. Tap 📷 to take a photo!</div>';
    (world.photos || []).forEach(p => list.appendChild(h(`<div class="alb photo"><img src="${p.src}"><b>${p.name}</b><small>${niceDate(p.d)}</small></div>`)));
  } else if (albumTab === 'collection') {
    const all = [...CHARS.baby, ...CHARS.child, ...CHARS.teen, ...CHARS.adult, ...CHARS.elder], seen = world.seen || [];
    list.innerHTML = `<div class="colhead">You met ${seen.length} of ${all.length}!</div><div class="colgrid"></div>`;
    const g = list.querySelector('.colgrid');
    all.forEach(id => { const cv = document.createElement('canvas'); cv.width = cv.height = 32; cv.className = 'col' + (seen.includes(id) ? '' : ' unseen'); const box = document.createElement('span'); box.className = 'colbox'; box.appendChild(cv); const im = img(charSrc(id)); const go = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; const cs = im.naturalWidth / 4; drawCell(c, im, 1, cs, (32 - cs) / 2, 32 - cs, false); }; if (im.complete) go(); else im.addEventListener('load', go); g.appendChild(box); });
  } else if (albumTab === 'family') {
    const alb = load(ALB_KEY, []).filter(e => !e.reset).slice().reverse();
    const chain = [...alb, ...(pet && pet.name ? [{ name: pet.name, sprite: pet.sprite, gen: pet.gen || 1, now: true }] : [])];
    if (!chain.length) { list.innerHTML = '<div class="empty">No family yet.</div>'; return; }
    const tree = h('<div class="tree"></div>');
    chain.forEach((e, i) => {
      if (i) tree.appendChild(h('<div class="treearrow">⬇</div>'));
      const cv = document.createElement('canvas'); cv.width = cv.height = 32;
      const im = img(charSrc(e.sprite)); const go = () => { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; const cs = im.naturalWidth / 4; drawCell(c, im, 1, cs, (32 - cs) / 2, 32 - cs, false); }; if (im.complete) go(); else im.addEventListener('load', go);
      const n = h(`<div class="treenode ${e.now ? 'now' : ''}"><b>${e.name}</b><small>Generation ${e.gen || 1}${e.now ? ' · now' : ''}</small></div>`); n.prepend(cv); tree.appendChild(n);
    });
    list.appendChild(tree);
  }
}

// ================================================================ TRAITS (simple words; change which wishes come more often)
const TRAITS = { active: { en: 'Active', cat: 'play' }, hungry: { en: 'Hungry', cat: 'food' }, sleepy: { en: 'Sleepy', cat: 'sleep' }, smart: { en: 'Smart', cat: 'study' }, friendly: { en: 'Friendly', cat: 'hug' }, shy: { en: 'Shy', cat: null } };
function ensureTrait() { if (pet && pet.stage > 0 && !pet.trait) { pet.trait = rnd(Object.keys(TRAITS)); save(); } }
const _makeNeed = makeNeed;
makeNeed = function (stage) {
  ensureTrait();
  const want = pet && TRAITS[pet.trait] && TRAITS[pet.trait].cat;
  if (want && Math.random() < .3) for (let i = 0; i < 8; i++) { const n = _makeNeed(stage); if (n.ok.some(id => ITEM[id].cat === want)) return n; }
  return _makeNeed(stage);
};
const _updateProfile2 = updateProfile;
updateProfile = function () {
  _updateProfile2();
  if (pet && pet.trait && $('profile').querySelector('.prow')) $('profile').querySelector('h3').insertAdjacentHTML('beforeend', `<span class="trait">${TRAITS[pet.trait].en}</span>`);
};

// ================================================================ FRIENDS: playdates & gifts, phone calls, birthday party
const _visitFriend2 = visitFriend;
visitFriend = async function () {
  const r = await _visitFriend2();
  if (Math.random() < .5) {
    const name = r.diary.match(/My friend (\w+)/)[1], f = world.friends[name];
    let fx = 70;
    view.x = view.tx = 30;
    scene('park', { draw(c, t) { stepMe(); drawMe(c, t, meCell(t), Math.abs(view.tx - view.x) > .4 && view.flip); drawChar(c, f.sprite, fx, FEET, animCell('cheer', t), true); } });
    talk(`Let's play at the park!`, name); setAnim('cheer', 1500);
    const play = rnd(byCat('play').filter(i => i.sport));
    await choose('💬 Answer', shuffle([`OK! Let's play ${play.en}!`, 'Good night!', "I'm ten."]).map(t => ({ label: t, t })), o => o.t.startsWith('OK'), { cols: 1 });
    for (let i = 0; i < 3; i++) { view.tx = 30 + Math.random() * 20; await hop(1, 5); burst('heart', 1); }
    const gift = rnd(['cookie', 'candy', 'banana', 'juice']);
    talk(`That was fun! Here's ${CUP[gift][2] === 'orange juice' ? 'some' : 'a'} ${CUP[gift][2]}!`, name); addCup(gift); sfx('task_complete.ogg', .4);
    await choose('💬 Answer', shuffle(['Thank you!', 'Good morning!', 'Me too!']).map(t => ({ label: t, t })), o => o.t === 'Thank you!', { cols: 1 });
    r.diary = `I played ${play.en} with ${name} in the park.`;
  }
  return r;
};
async function phoneCall() {
  const known = Object.keys(world.friends), name = known.length ? rnd(known) : rnd(FRIEND_NAMES);
  let ring = true;
  view.x = view.tx = 26;
  scene(shop.room || 'home_03', { draw(c, t) {
    drawDecor(c, t); drawMe(c, t, meCell(t));
    const ph = img('assets/ui/mobile-phone.png'); if (ph.complete) { const sh = ring ? Math.sin(t / 30) * 1.5 : 0; c.drawImage(ph, 54 + sh, 8, 40, 68); }
  } });
  sfx('pop_01.mp3', .5); talk('Ring, ring! The phone is ringing!');
  let wrong = await choose('📞 What do you say?', shuffle(['Hello?', 'Goodbye!', 'Thank you!']).map(t => ({ label: t, t })), o => o.t === 'Hello?', { cols: 1 });
  ring = false; setAnim('talk', 1500);
  const place = rnd(['the park', 'the zoo', 'the sea', 'my house']), day = rnd(['today', 'tomorrow', 'on Sunday']);
  talk(`Hi! This is ${name}. Let's go to ${place} ${day}!`, name);
  wrong += await choose('💬 Answer', shuffle(['Yes, let\'s go!', 'I\'m ten.', 'Good night!']).map(t => ({ label: t, t })), o => o.t.startsWith('Yes'), { cols: 1 });
  talk('Great! See you!', name);
  wrong += await choose('💬 Answer', shuffle(['See you!', 'Nice to meet you.', 'Hello?']).map(t => ({ label: t, t })), o => o.t === 'See you!', { cols: 1 });
  setAnim('cheer', 1000); await sleep(800);
  return { good: wrong === 0, stars: 3, diary: `${name} called me. We will go to ${place} ${day}.` };
}
async function birthdayParty() {
  const known = Object.keys(world.friends), guests = known.length ? pickN(known, Math.min(2, known.length)) : pickN(FRIEND_NAMES, 2);
  const gs = guests.map(n => (world.friends[n] && world.friends[n].sprite) || rnd(CHARS.child));
  view.x = view.tx = 48;
  scene(shop.room || 'home_03', { draw(c, t) {
    drawDecor(c, t); drawPic(c, 'misc/table_01', 27, FEET - 20); drawPic(c, 'misc/cake_01', 39, FEET - 30);
    drawChar(c, gs[0], 16, FEET, animCell('cheer', t), false); if (gs[1]) drawChar(c, gs[1], 82, FEET, animCell('cheer', t), true);
    drawMe(c, t, animCell('cheer', t));
  } });
  sfx('birthday_song_01.ogg', .5); confetti();
  talk(`Happy birthday, ${pet.name}!`, guests.join(' and '));
  await choose('💬 Answer', shuffle(['Thank you!', 'Good night!', 'See you!']).map(t => ({ label: t, t })), o => o.t === 'Thank you!', { cols: 1 });
  const toy = rnd(TOYS); if (!world.toys.includes(toy.id)) world.toys.push(toy.id); saveWorld();
  talk(`This is for you! A ${toy.en}!`, guests[0]); burst('heart', 6); await sleep(1800);
  endScene(); homeBg();
}
const _success3 = success;
success = async function (it, fromRect) {
  const bday = need && need.birthday && need.ok.includes(it.id);
  if (bday) need.birthday = false;
  if (bday) { glowCats(false); hideBubble(); await birthdayParty(); need.birthday = true; }
  return _success3(it, fromRect);
};

// ================================================================ ISLAND FRUIT COLLECTOR (original islandCollectionGame)
async function gameIsland() {
  const MAP = 960, cols = Object.keys(APPLE), col = rnd(cols), GOAL = 5;
  const inGrass = () => 220 + Math.random() * 520;
  const trees = Array.from({ length: 26 }, () => ({ x: inGrass(), y: inGrass() }));
  const apples = Array.from({ length: 34 }, (_, i) => ({ x: inGrass(), y: inGrass(), k: i < 12 ? col : rnd(cols) }));
  let px = 480, py = 480, tx = null, ty = null, got = 0, t0 = performance.now(), done = false;
  view.x = view.tx = 48;
  talk(`Find ${GOAL} ${col} apples!`);
  const box = panel('🏝️ Fruit island', '<div class="ahelp">👆 Hold on the screen to walk</div>');
  box.prepend(cellIcon('misc/apples_01', 8, 4, APPLE[col] + 1, 48));
  const sc = h(`<div class="ascore">0 / ${GOAL}</div>`), tm = h('<div class="atime">⏱ 45</div>'); box.append(sc, tm);
  return new Promise(res => scene('sky_afternoon', {
    move(x, y) { if (window.pointerHeld) { tx = x; ty = y; } },
    up() { tx = null; },
    tap(x, y) { tx = x; ty = y; },
    draw(c, t) {
      const left = Math.max(0, 45 - (t - t0) / 1000); tm.textContent = '⏱ ' + Math.ceil(left);
      const r = petRect(), cs = r.w;
      if (tx !== null && window.pointerHeld) { const dx = tx - 48, dy = ty - (FEET - cs / 2); const d = Math.hypot(dx, dy); if (d > 3) { px += dx / d * .9; py += dy / d * .9; view.flip = dx > 0; view.anim = 'walk'; view.animUntil = t + 100; } }
      px = Math.max(110, Math.min(850, px)); py = Math.max(110, Math.min(850, py));
      const ox = px - 48, oy = py - (FEET - cs / 2);
      const map = img('assets/bg/island.png'); if (map.complete) c.drawImage(map, ox, oy, 96, 96, 0, 0, 96, 96);
      const things = [...trees.map(tr => ({ ...tr, tree: 1 })), ...apples.filter(a => !a.gone)].sort((a, b) => a.y - b.y);
      let meDrawn = false;
      for (const o of things) {
        if (!meDrawn && o.y > py + 6) { drawMe(c, t, meCell(t), view.flip); meDrawn = true; }
        const sx = o.x - ox, sy = o.y - oy; if (sx < -30 || sx > 120 || sy < -70 || sy > 110) continue;
        if (o.tree) drawPic(c, 'misc/tree_01', sx - 10, sy - 60);
        else { const im = img('assets/misc/apples_01.png'); if (im.complete) c.drawImage(im, APPLE[o.k] * 8, 0, 8, 8, sx - 4, sy - 4, 8, 8); }
      }
      if (!meDrawn) drawMe(c, t, meCell(t), view.flip);
      for (const a of apples) if (!a.gone && Math.hypot(a.x - px, a.y - py) < 9) {
        a.gone = true;
        if (a.k === col) { got++; sc.textContent = `${got} / ${GOAL}`; sfx('pop_01.mp3', .4); burst('heart', 1); }
        else { sfx('refuse.ogg', .3); setAnim('refuse', 500); talk(`That's a ${a.k} apple. Find ${col} apples!`); }
      }
      if (!done && (got >= GOAL || left <= 0)) { done = true; res(gameEnd(got >= GOAL, `I found ${got} ${col} apples!`, 'I went to fruit island.')); }
    },
  }));
}

// ================================================================ PICTURE PUZZLE (original imagePuzzleGame: slide the tiles)
async function gamePuzzle() {
  const N = 3, CELL = 22, OX = 3, OY = 12;
  let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const nb = i => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter(j => j >= 0 && j < 9);
  for (let k = 0; k < 30; k++) { const e = tiles.indexOf(0), j = rnd(nb(e)); [tiles[e], tiles[j]] = [tiles[j], tiles[e]]; }
  if (tiles.join() === '1,2,3,4,5,6,7,8,0') { const e = tiles.indexOf(0), j = nb(e)[0]; [tiles[e], tiles[j]] = [tiles[j], tiles[e]]; }
  let moves = 0;
  view.x = view.tx = 84;
  talk('Put the numbers in order! One, two, three…');
  const box = panel('🧩 Number puzzle', '<div class="ahelp">👆 Tap a tile next to the space on the screen</div>');
  const mv = h('<div class="ascore">Moves: 0</div>'); box.appendChild(mv);
  return new Promise(res => scene('arcade2', {
    draw(c, t) {
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(OX - 2, OY - 2, CELL * 3 + 4, CELL * 3 + 4);
      const im = img('assets/misc/image_puzzle_01.png');
      tiles.forEach((n, i) => { if (!n || !im.complete) return; c.drawImage(im, ((n - 1) % 3) * 32, Math.floor((n - 1) / 3) * 32, 32, 32, OX + (i % 3) * CELL, OY + Math.floor(i / 3) * CELL, CELL - 1, CELL - 1); });
      drawMe(c, t, meCell(t));
    },
    tap(x, y) {
      const i = Math.floor((x - OX) / CELL) + Math.floor((y - OY) / CELL) * 3;
      if (x < OX || y < OY || x > OX + CELL * 3 || y > OY + CELL * 3) return;
      const e = tiles.indexOf(0);
      if (!nb(e).includes(i)) { sfx('refuse.ogg', .2); return; }
      [tiles[e], tiles[i]] = [tiles[i], tiles[e]]; moves++; mv.textContent = `Moves: ${moves}`; sfx('pop_01.mp3', .3);
      talk(`${NUM_WORDS[tiles[e]].replace(/^./, s => s.toUpperCase())}!`);
      if (tiles.join() === '1,2,3,4,5,6,7,8,0') res(gameEnd(true, `One, two, three, four, five, six, seven, eight! ${moves} moves!`, 'I did a number puzzle.'));
    },
  }));
}
// crop match = the memory game with crops
const _gm = gameMemory;
gameMemory = async function () { const r = await _gm(); return r; };

// ================================================================ register
ACTIVITIES.push({ id: 'phone', min: 2, cap: 1, w: 1.5, intro: () => 'Ring, ring!', run: phoneCall });
(function () {
  const g = ACTIVITIES.find(a => a.id === 'game');
  g.run = () => rnd([gameCatch, gameNumber, gameSimon, gameSpell, gameFlags, gameFoodQuiz, gameMemory, gameTiles, gameIsland, gamePuzzle])();
  ACTIVITIES.find(a => a.id === 'friend').run = () => visitFriend();
  ACTIVITIES.find(a => a.id === 'garden').run = () => garden();
  PLACES.market = () => shopping();
  const holidayAct = ACTIVITIES.find(a => a.id === 'holiday'); const hr = holidayAct.run; holidayAct.run = () => hr();
})();

// shop: seeds tab + move furniture button
(function () {
  const tabs = document.querySelector('#shop .tabs');
  tabs.appendChild(h('<button data-tab="seeds">🌱 Seeds</button>'));
  tabs.lastChild.onclick = () => { shopTab = 'seeds'; renderShop(); };
  const prev = renderShop;
  renderShop = function () {
    if (shopTab === 'seeds') {
      $('shopStars').textContent = shop.stars;
      document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'seeds'));
      const g = $('shopGrid'); g.innerHTML = '<div class="slotHelp">Plant seeds in the garden. You have the numbers shown.</div>';
      SEED_SHOP.forEach(sd => {
        const c = CROPS.find(x => x.id === sd.id), d = h(`<button class="sitem${shop.stars < sd.price ? ' cant' : ''}"><div class="fthumb"></div><div>${sd.en}</div><div class="price">⭐ ${sd.price} · have ${world.seeds[sd.id] || 0}</div></button>`);
        d.querySelector('.fthumb').appendChild(icon('plant', c.spr + 2, 64));
        d.onclick = () => { if (shop.stars < sd.price) { sfx('refuse.ogg', .4); return; } shop.stars -= sd.price; world.seeds[sd.id] = (world.seeds[sd.id] || 0) + 1; store(SHOP_KEY, shop); saveWorld(); count('bought'); sfx('task_complete.ogg'); updateTop(); renderShop(); };
        g.appendChild(d);
      });
      return;
    }
    prev();
    if (shopTab === 'furn') document.querySelectorAll('#shopGrid .sitem.on').forEach(d => {
      const name = d.children[1].textContent, it = FURNITURE.find(f => f.en === name);
      if (!it) return;
      const mb = h('<span class="movebtn">↔ Move</span>'); mb.onclick = e => { e.stopPropagation(); moveFurniture(it.id); }; d.appendChild(mb);
    });
  };
})();

// start-up: if it's night and the pet went to bed, keep it asleep
(function () {
  if (pet && pet.asleepAt && isNight()) { window.asleep = true; setTimeout(() => { $('nightLayer').classList.remove('hidden'); setAnim('sleep', 1e9); }, 600); }
  else if (pet && pet.asleepAt) delete pet.asleepAt;
})();

// coming back while the pet sleeps: no greeting, just "Zzz"
const _welcomeBack = welcomeBack;
welcomeBack = async function () { if (window.asleep) { pet.lastSeen = Date.now(); save(); return; } return _welcomeBack(); };
