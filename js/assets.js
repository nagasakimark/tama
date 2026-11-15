// ============================================================
//  Artwork & sound from Tamaweb by autosam – CC BY-NC-SA 4.0
//  https://github.com/autosam/Tamaweb   (see assets/LICENSE-Tamaweb.txt)
// ============================================================

const IMG_CACHE = {};
function img(src) {
  if (!IMG_CACHE[src]) { const i = new Image(); i.src = src; IMG_CACHE[src] = i; }
  return IMG_CACHE[src];
}
const charSrc = id => `assets/character/${id}.png`;
const bgSrc = id => `assets/bg/${id}${id === 'home_01' ? '.jpg' : '.png'}`;

// cell size of the 4×4 sprite sheet for each life stage
const CELL = { 1: 16, 2: 24, 3: 24, 4: 32, 5: 32 };
const STAGE_KEY = { 1: 'baby', 2: 'child', 3: 'teen', 4: 'adult', 5: 'elder' };

// animation frames (1-based cells, end exclusive – same as the original)
const ANIM = {
  idle:     { f: [1], t: 500 },
  side:     { f: [9], t: 500 },
  walk:     { f: [10, 11], t: 130 },
  talk:     { f: [10, 11], t: 120 },
  cheer:    { f: [2, 3], t: 220 },
  eat:      { f: [14, 15], t: 230 },
  refuse:   { f: [4, 5, 6], t: 260 },
  sad:      { f: [4, 5], t: 500 },
  angry:    { f: [6], t: 500 },
  shocked:  { f: [7], t: 500 },
  blush:    { f: [8], t: 500 },
  sleep:    { f: [16], t: 500 },
  sit:      { f: [14], t: 500 },
  kiss:     { f: [12, 13], t: 250 },
};

// home rooms you can buy with stars
const ROOMS = [
  { id: 'home_03', en: 'Peach room', price: 0 },
  { id: 'home_02', en: 'Blue room', price: 8 },
  { id: 'home_06', en: 'Pastel room', price: 8 },
  { id: 'home_04', en: 'Pink room', price: 10 },
  { id: 'home_07', en: 'Wood room', price: 10 },
  { id: 'home_cc06', en: 'Toy room', price: 12 },
  { id: 'home_cc07', en: 'Sunny room', price: 12 },
  { id: 'home_parents', en: 'Cozy room', price: 12 },
  { id: 'home_cc05', en: 'Fridge room', price: 14 },
  { id: 'home_cc08', en: 'Mushroom room', price: 15 },
  { id: 'home_cc03', en: 'Classic room', price: 15 },
  { id: 'home_08', en: 'Night room', price: 16 },
  { id: 'home_ex', en: 'Heart room', price: 18 },
  { id: 'home_cc01', en: 'Space room', price: 20 },
  { id: 'home_01', en: 'Fireplace room', price: 22 },
  { id: 'home_galaxy', en: 'Galaxy', price: 25 },
];

// accessories you can buy with stars (64px cells, follow the pet's frame)
const ACCS = [
  { id: 'mini_band_01', en: 'Ribbon', price: 5, front: true },
  { id: 'pumpkin_01', en: 'Pumpkin', price: 6, front: true },
  { id: 'fedora_01', en: 'Hat', price: 8, front: true },
  { id: 'cone_cap_01', en: 'Party hat', price: 8, front: true },
  { id: 'frooties_01', en: 'Fruit friends', price: 8, front: false },
  { id: 'purple_headphones_01', en: 'Headphones', price: 10, front: true },
  { id: 'deer_head_01', en: 'Antlers', price: 10, front: true },
  { id: 'crown_01', en: 'Crown', price: 12, front: true },
  { id: 'witch_hat_01', en: 'Witch hat', price: 12, front: true },
  { id: 'santa_hat_01', en: 'Santa hat', price: 12, front: true },
  { id: 'bouquet_01', en: 'Flowers', price: 12, front: true },
  { id: 'bunny_balloon_01', en: 'Balloon', price: 14, front: true },
  { id: 'bear_hat_01', en: 'Bear hat', price: 15, front: true },
  { id: 'rainbow_hat_01', en: 'Rainbow hat', price: 15, front: true },
  { id: 'woodland_headdress_01', en: 'Leaf crown', price: 15, front: true },
  { id: 'tv_head_01', en: 'TV head', price: 16, front: true },
  { id: 'wings_01', en: 'Wings', price: 18, front: false },
  { id: 'cupid_wings_01', en: 'Love wings', price: 20, front: false },
  { id: 'rainbow_01', en: 'Rainbow', price: 22, front: false },
  { id: 'kings_crown_01', en: 'King crown', price: 25, front: true },
];

// where each activity happens. bg = background, e = big picture on top
const PLACE_OF = {
  // play
  soccer: { bg: 'park' }, baseball: { bg: 'park' }, basketball: { bg: 'gym' }, tennis: { bg: 'park' }, volleyball: { bg: 'beach' },
  badminton: { bg: 'gym' }, tabletennis: { bg: 'gym' }, videogames: { bg: 'arcade' }, cards: { bg: 'arcade' },
  piano: { bg: 'music' }, guitar: { bg: 'music' }, drums: { bg: 'music' },
  // fun
  sing: { bg: 'music' }, dance: { bg: 'music' }, cook: { bg: 'kitchen2' }, swim: { bg: 'beach' }, bike: { bg: 'skatepark' },
  skate: { bg: 'skatepark' }, camera: { bg: 'park2' },
  // study
  japanese: { bg: 'classroom' }, english: { bg: 'classroom' }, math: { bg: 'classroom' }, science: { bg: 'clinic' }, social: { bg: 'classroom' },
  music: { bg: 'music' }, pe: { bg: 'gym' }, arts: { bg: 'classroom' }, homeec: { bg: 'kitchen3' }, calligraphy: { bg: 'classroom' },
  // go
  park: { bg: 'park' }, library: { bg: 'home_cc03', e: '📚' }, zoo: { bg: 'park2', e: '🦁' }, aquarium: { bg: 'aquarium' }, sea: { bg: 'beach' },
  mountains: { bg: 'sky', e: '⛰️' }, amusement: { bg: 'sky', e: '🎢' }, conbini: { bg: 'market', e: '🏪' }, station: { bg: 'walkway', e: '🚉' },
  postoffice: { bg: 'postoffice' }, museum: { bg: 'mall', e: '🦖' }, school: { bg: 'classroom' }, shrine: { bg: 'garden', e: '⛩️' },
  bakery: { bg: 'stand', e: '🥐' }, supermarket: { bg: 'market' }, flowershop: { bg: 'garden', e: '💐' },
};
const CAT_PLACE = { food: 'kitchen', drink: 'kitchen', clean: 'bathroom', trip: 'sky' };

const SFX = {};
function sfx(name, vol = 0.6) {
  if (!window.soundOn) return;
  try {
    const src = 'assets/sfx/' + name;
    const a = (SFX[src] = SFX[src] || new Audio(src)).cloneNode();
    a.volume = vol; a.play().catch(() => {});
  } catch (e) {}
}
