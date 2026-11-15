// ============================================================
//  Original pixel art for Tama Talk (drawn in code)
//  o outline  b body  l light  d shade  w white
// ============================================================

const SPR = {
  egg: {
    map: [
      '....oooo....',
      '...obbbbo...',
      '..obllbbbo..',
      '.obllbbbbbo.',
      '.oblbbbwbbo.',
      'obbbbbwwwbbo',
      'obwbbbbwbbbo',
      'owwwbbbbbbbo',
      'obwbbbbbwbbo',
      'obbbbbbwwwbo',
      'obbbbbbbwbbo',
      '.odbbbbbbbdo',
      '.oddbbbbbddo',
      '..ooddddoo..',
      '....oooo....',
    ],
  },
  1: { // baby
    map: [
      '....oooo....',
      '..oobbbboo..',
      '.obllbbbbbo.',
      '.oblbbbbbbo.',
      'obbbbbbbbbbo',
      'obbbbbbbbbbo',
      'obbbbbbbbbbo',
      'odbbbbbbbbdo',
      '.oddbbbbddo.',
      '..oooooooo..',
    ],
    eyes: [[3, 4], [8, 4]], ew: 1, mouth: [5, 6], cheeks: [[2, 6], [9, 6]], head: 0,
  },
  2: { // child – little ears
    map: [
      '.oo........oo.',
      'obbo......obbo',
      'obbboooooobbbo',
      'obbbbbbbbbbbbo',
      'obllbbbbbbbbbo',
      'oblbbbbbbbbbbo',
      'obbbbbbbbbbbbo',
      'obbbbbbbbbbbbo',
      'obbbbbbbbbbbbo',
      'odbbbbbbbbbbdo',
      '.oddbbbbbbddo.',
      '..oooooooooo..',
      '...oo....oo...',
    ],
    eyes: [[4, 5], [9, 5]], ew: 1, mouth: [6, 7], cheeks: [[3, 7], [10, 7]], head: 2,
  },
  3: { // teen – taller, sprout on top
    map: [
      '.......oo.......',
      '......obbo......',
      '.....oooooo.....',
      '...oobbbbbboo...',
      '..obllbbbbbbbo..',
      '.obllbbbbbbbbbo.',
      '.oblbbbbbbbbbbo.',
      'obbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbo',
      'odbbbbbbbbbbbbdo',
      'odbbbbbbbbbbbbdo',
      '.odbbbbbbbbbbdo.',
      '..oddbbbbbbddo..',
      '...oooooooooo...',
      '...obo....obo...',
      '...ooo....ooo...',
    ],
    eyes: [[5, 8], [10, 8]], ew: 1, mouth: [7, 10], cheeks: [[4, 10], [11, 10]], head: 3,
  },
  4: { // adult – big, ears, feet
    map: [
      '..oo............oo..',
      '.obbo..........obbo.',
      '.obbboooooooooobbbo.',
      '.obbbbbbbbbbbbbbbbo.',
      'obllbbbbbbbbbbbbbbbo',
      'oblbbbbbbbbbbbbbbbbo',
      'oblbbbbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbbbbbo',
      'obbbbbbbbbbbbbbbbbbo',
      'odbbbbbbbbbbbbbbbbdo',
      'odbbbbbbbbbbbbbbbbdo',
      'oddbbbbbbbbbbbbbbddo',
      '.odbbbbbbbbbbbbbbdo.',
      '..oddbbbbbbbbbbddo..',
      '...oooooooooooooo...',
      '....obbo....obbo....',
      '....oooo....oooo....',
    ],
    eyes: [[6, 7], [12, 7]], ew: 2, mouth: [9, 10], cheeks: [[4, 10], [15, 10]], head: 2,
  },
};
SPR[5] = SPR[4]; // senior uses adult body + extras

const POOP = [
  '...oo...',
  '..obbo..',
  '..oooo..',
  '.obbbbo.',
  '.obwbbo.',
  'oooooooo',
  'obbbbwbo',
  'oooooooo',
];

function mapSize(m) { return { w: m[0].length, h: m.length }; }

// draw a pixel map; x,y = top-left in scene pixels
function drawMap(ctx, map, x, y, pal) {
  for (let r = 0; r < map.length; r++) {
    const row = map[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch] || '#f0f';
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

function px(ctx, col, x, y, w = 1, h = 1) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }

// face: 'normal' | 'blink' | 'happy' | 'sad' | 'sleep' | 'talk' | 'no'
function drawFace(ctx, spr, x, y, face, pal, senior) {
  const ink = '#2b1d2a';
  const [e1, e2] = spr.eyes; const ew = spr.ew;
  for (const [ex, ey] of [e1, e2]) {
    const X = x + ex, Y = y + ey;
    if (face === 'blink' || face === 'sleep') {
      px(ctx, ink, X - (ew === 1 ? 0 : 0), Y + 1, ew + (ew === 1 ? 1 : 0), 1);
    } else if (face === 'happy') {
      px(ctx, ink, X - 1, Y + 1); px(ctx, ink, X, Y, ew); px(ctx, ink, X + ew, Y + 1);
    } else if (face === 'sad' || face === 'no') {
      px(ctx, ink, X, Y, ew, 2);
      // sad brows
      if (ex === e1[0]) px(ctx, ink, X - 1, Y - 2, 2, 1); else px(ctx, ink, X + ew - 1, Y - 2, 2, 1);
    } else {
      px(ctx, ink, X, Y, ew, 2);
      if (ew === 2) px(ctx, '#ffffff', X, Y);
    }
    if (senior && face !== 'sleep') px(ctx, '#f4f4f4', X - 1, Y - 2, ew + 2, 1);
  }
  // cheeks
  ctx.globalAlpha = 0.65;
  for (const [cx, cy] of spr.cheeks) px(ctx, '#ff6f91', x + cx, y + cy, ew === 2 ? 2 : 1, 1);
  ctx.globalAlpha = 1;
  // mouth
  const [mx, my] = spr.mouth; const MX = x + mx, MY = y + my;
  if (face === 'happy' || face === 'talk') {
    px(ctx, ink, MX, MY, 2, 1); px(ctx, '#e8466c', MX, MY + 1, 2, 1);
  } else if (face === 'sad' || face === 'no') {
    px(ctx, ink, MX, MY + 1, 2, 1); px(ctx, ink, MX - 1, MY + 2); px(ctx, ink, MX + 2, MY + 2);
  } else if (face === 'sleep') {
    px(ctx, ink, MX, MY + 1, 2, 1);
  } else {
    px(ctx, ink, MX, MY, 1, 1); px(ctx, ink, MX + 1, MY, 1, 1);
  }
}

// hat / glasses etc. drawn on adult+
function drawAccessory(ctx, acc, spr, x, y, w) {
  const cx = x + Math.floor(w / 2);
  const ink = '#2b1d2a';
  if (acc === 'glasses') {
    for (const [ex, ey] of spr.eyes) {
      const gx = x + ex - 2, gy = y + ey - 1;
      ctx.globalAlpha = 0.35; px(ctx, '#ffffff', gx + 1, gy + 1, 4, 2); ctx.globalAlpha = 1;
      px(ctx, ink, gx, gy, 6, 1); px(ctx, ink, gx, gy + 3, 6, 1);
      px(ctx, ink, gx, gy, 1, 4); px(ctx, ink, gx + 5, gy, 1, 4);
    }
    const lx = x + spr.eyes[0][0] + 4, rx = x + spr.eyes[1][0] - 2;
    if (rx > lx) px(ctx, ink, lx, y + spr.eyes[0][1], rx - lx, 1);
  } else if (acc === 'band') {
    px(ctx, '#ff3b3b', x + 1, y + 4, w - 2, 2); px(ctx, '#ffffff', x + 1, y + 4, w - 2, 1);
    ctx.globalAlpha = 1; px(ctx, '#ff3b3b', x + w - 1, y + 5, 3, 1); px(ctx, '#ff3b3b', x + w, y + 6, 2, 1);
  } else if (acc === 'chef') {
    const hy = y - 6;
    px(ctx, ink, cx - 5, hy, 10, 1);
    px(ctx, ink, cx - 6, hy + 1, 1, 6); px(ctx, ink, cx + 5, hy + 1, 1, 6);
    px(ctx, '#ffffff', cx - 5, hy + 1, 10, 6);
    px(ctx, '#e6e6e6', cx - 5, hy + 5, 10, 2);
    px(ctx, ink, cx - 5, hy + 7, 10, 1);
  } else if (acc === 'explorer') {
    const hy = y - 2;
    px(ctx, ink, cx - 8, hy + 3, 16, 1);
    px(ctx, '#c79a52', cx - 7, hy + 2, 14, 1);
    px(ctx, ink, cx - 5, hy - 2, 10, 1);
    px(ctx, '#d9b36a', cx - 5, hy - 1, 10, 3);
    px(ctx, '#8a5a2b', cx - 5, hy + 1, 10, 1);
  } else if (acc === 'bow') {
    const bx = x + w - 6, by = y + 1;
    px(ctx, '#ff4f9a', bx, by, 2, 3); px(ctx, '#ff4f9a', bx + 4, by, 2, 3); px(ctx, '#c4136a', bx + 2, by + 1, 2, 1);
    px(ctx, '#ff4f9a', bx + 2, by + 1, 2, 1);
  } else if (acc === 'flower') {
    const fx = x + 3, fy = y + 1;
    px(ctx, '#ffffff', fx, fy - 1); px(ctx, '#ffffff', fx - 1, fy); px(ctx, '#ffffff', fx + 1, fy); px(ctx, '#ffffff', fx, fy + 1);
    px(ctx, '#ffd84a', fx, fy);
  }
}

function drawCane(ctx, x, y, h) {
  px(ctx, '#7a4a1e', x, y, 1, h);
  px(ctx, '#7a4a1e', x + 1, y - 1, 2, 1); px(ctx, '#7a4a1e', x + 3, y, 1, 2);
}

function palette(color) {
  const c = COLORS[color] || COLORS.pink;
  return { o: c.line, b: c.body, l: c.light, d: c.shade, w: '#ffffff' };
}
const POOP_PAL = { o: '#4a2a12', b: '#9a5b2a', w: '#c98a52' };

// ---------- room ----------
function drawRoom(ctx, W, H, floorY, t) {
  // wall
  px(ctx, '#fff4cc', 0, 0, W, floorY);
  for (let x = 0; x < W; x += 8) px(ctx, '#ffe9a8', x, 0, 4, floorY);
  // window
  px(ctx, '#ffffff', 7, 4, 24, 17);
  px(ctx, '#8fdcff', 8, 5, 22, 15);
  const cloudX = 8 + ((t / 400) % 30) - 6;
  ctx.save(); ctx.beginPath(); ctx.rect(8, 5, 22, 15); ctx.clip();
  px(ctx, '#ffffff', cloudX, 9, 7, 2); px(ctx, '#ffffff', cloudX + 2, 8, 3, 1);
  px(ctx, '#ffe066', 24, 7, 3, 3);
  px(ctx, '#7ed957', 8, 17, 22, 3);
  ctx.restore();
  px(ctx, '#ffffff', 18, 5, 2, 15); px(ctx, '#ffffff', 8, 12, 22, 1);
  px(ctx, '#ff8fab', 5, 3, 4, 19); px(ctx, '#ff8fab', 29, 3, 4, 19); // curtains
  // picture
  px(ctx, '#c47a3a', W - 30, 5, 16, 12); px(ctx, '#a8e6ff', W - 29, 6, 14, 10);
  px(ctx, '#ffd84a', W - 26, 8, 3, 3); px(ctx, '#7ed957', W - 29, 13, 14, 3); px(ctx, '#ff6f91', W - 20, 11, 2, 2);
  // baseboard + floor
  px(ctx, '#e0a86b', 0, floorY - 1, W, 1);
  px(ctx, '#f3c48c', 0, floorY, W, H - floorY);
  for (let y = floorY + 3; y < H; y += 4) px(ctx, '#e8b277', 0, y, W, 1);
  for (let y = floorY, i = 0; y < H; y += 4, i++) for (let x = (i % 2) * 12; x < W; x += 24) px(ctx, '#e8b277', x, y, 1, 4);
  // rug
  ctx.fillStyle = '#ffb3c7';
  ctx.beginPath(); ctx.ellipse(W * 0.36, floorY + 6, 26, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd1de';
  ctx.beginPath(); ctx.ellipse(W * 0.36, floorY + 6, 20, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  // plant
  const pxp = W - 12;
  px(ctx, '#d9773a', pxp, floorY - 6, 7, 7); px(ctx, '#b85f2a', pxp, floorY - 6, 7, 1);
  px(ctx, '#3fae49', pxp + 3, floorY - 14, 1, 8); px(ctx, '#57c95d', pxp, floorY - 12, 3, 2); px(ctx, '#57c95d', pxp + 4, floorY - 15, 3, 2); px(ctx, '#57c95d', pxp + 4, floorY - 10, 4, 2);
}
