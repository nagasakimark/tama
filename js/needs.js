// ============================================================
//  Request generator – the tama says what it wants in English.
//  Each request: { en, ja, ok:[item ids], show:[ids to put in trays],
//                  avoid:{id: 'reply if given'} }
// ============================================================

const rnd = a => a[Math.floor(Math.random() * a.length)];
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const ids = c => byCat(c).map(i => i.id);
const unlocked = (stage, cat) => CATEGORIES.find(c => c.id === cat).unlock <= stage;
function two(cat) {
  const a = rnd(byCat(cat));
  let b; do { b = rnd(byCat(cat)); } while (b.id === a.id);
  return [a, b];
}

const JA_LETS = { tv: 'テレビを みよう', book: 'ほんを よもう', sing: 'うたを うたおう', dance: 'おどろう', draw: 'えを かこう', cook: 'りょうりを しよう', swim: 'およごう', bike: 'じてんしゃに のろう', camera: 'しゃしんを とろう', skate: 'スケートを しよう' };

// [minStage, maxStage, weight, fn(stage)]
const NEEDS = [
  // ----- feelings (baby and up) -----
  [1, 5, 3, s => ({ key: 'hungry', en: "I'm hungry.", ja: 'おなかが すいた。', ok: ids('food') })],
  [1, 5, 2, s => ({ key: 'thirsty', en: "I'm thirsty.", ja: 'のどが かわいた。', ok: ids('drink') })],
  [1, 5, 2, s => ({ key: 'sleepy', en: "I'm sleepy.", ja: 'ねむい…。', ok: ['bed'] })],
  [1, 3, 2, s => ({ key: 'bored', en: "I'm bored.", ja: 'たいくつ…。あそびたい！', ok: [...ids('play'), ...(s >= 2 ? ids('fun') : [])] })],
  [1, 5, 1.5, s => ({ key: 'dirty', en: "I'm dirty.", ja: 'よごれちゃった。', ok: ['bath', 'shower'] })],
  [1, 5, 1.5, s => ({ key: 'sad', en: s >= 3 ? "I'm sad. Hug me, please." : "I'm sad.", ja: 'かなしい…。', ok: ['hug'] })],
  [1, 5, 1.5, s => ({ key: 'poop', en: 'Oops! Sorry!', ja: 'うんち しちゃった！ そうじして！', ok: ['cleanup'], poop: true })],

  // ----- child -----
  [2, 5, 3, s => { const f = rnd(byCat('food')); return { key: 'want:' + f.id, en: `I want ${f.a}.`, ja: `${f.ja}が ほしい。`, ok: [f.id] }; }],
  [2, 5, 1.5, s => { const f = rnd(byCat('food')); return { key: 'want:' + f.id, en: `${cap1(f.a)}, please!`, ja: `${f.ja}を ください！`, ok: [f.id] }; }],
  [2, 5, 2, s => { const d = rnd(byCat('drink')); return { key: 'want:' + d.id, en: `I want ${d.a}.`, ja: `${d.ja}が ほしい。`, ok: [d.id] }; }],
  [2, 4, 1.5, s => { const f = rnd(byCat('food')); return { key: 'like:' + f.id, en: `I'm hungry. I like ${f.pl}.`, ja: `おなかが すいた。${f.ja}が すき。`, ok: [f.id] }; }],
  [2, 5, 1.5, s => ({ key: 'cold', en: "I'm cold.", ja: 'さむい！', ok: ['jacket', 'scarf', 'gloves', 'cocoa'] })],
  [2, 5, 1.5, s => ({ key: 'hot', en: "I'm hot.", ja: 'あつい！', ok: ['tshirt', 'shavedice', 'icecream', 'water', 'soda', 'swim', ...(s >= 3 ? ['sea'] : [])] })],
  [2, 5, 1.5, s => { const w = rnd(byCat('wear')); return { key: 'want:' + w.id, en: `I want ${w.a}.`, ja: `${w.ja}が ほしい。`, ok: [w.id] }; }],
  [2, 5, 1, s => ({ key: 'hands', en: 'My hands are dirty.', ja: 'てが よごれた。', ok: ['hands'] })],
  [2, 5, 2, s => { const p = rnd(byCat('play').filter(i => i.sport)); return { key: 'play:' + p.id, en: `Let's play ${p.en}!`, ja: `${p.ja}を しよう！`, ok: [p.id] }; }],
  [2, 5, 1.5, s => { const f = rnd(byCat('fun')); return { key: 'fun:' + f.id, en: `Let's ${f.en}!`, ja: `${JA_LETS[f.id]}！`, ok: [f.id] }; }],

  // ----- teen -----
  [3, 5, 2.5, s => { const p = rnd(byCat('play')); return { key: 'play:' + p.id, en: `I want to play ${p.en}.`, ja: `${p.jaWant}。`, ok: [p.id] }; }],
  [3, 5, 2.5, s => { const t = rnd(byCat('study')); return { key: 'study:' + t.id, en: `I want to study ${t.en}.`, ja: `${t.ja}を べんきょう したい。`, ok: [t.id] }; }],
  [3, 5, 2.5, s => { const g = rnd(byCat('go')); return { key: 'go:' + g.id, en: `I want to go to ${g.en}.`, ja: `${g.ja}に いきたい。`, ok: [g.id] }; }],
  [3, 5, 2, s => { const f = rnd(byCat('fun')); return { key: 'fun:' + f.id, en: `I want to ${f.en}.`, ja: `${f.jaWant}。`, ok: [f.id] }; }],
  [3, 5, 2, s => { const f = rnd([...byCat('food'), ...byCat('drink')]); return { key: 'want:' + f.id, en: `I'd like ${f.a}, please.`, ja: `${f.ja}を おねがいします。`, ok: [f.id] }; }],
  [3, 5, 1, s => ({ key: 'rainy', en: "It's rainy.", ja: 'あめが ふってる。', ok: ['umbrella', 'boots'] })],
  [3, 5, 1, s => ({ key: 'sunny', en: "It's sunny. It's hot!", ja: 'はれ！ まぶしい！', ok: ['sunglasses', 'cap'] })],
  [3, 5, 1, s => ({ key: 'snowy', en: "It's snowy. It's cold!", ja: 'ゆきだ！ さむい！', ok: ['jacket', 'scarf', 'gloves', 'boots'] })],
  [3, 5, 1, s => ({ key: 'teeth', en: 'I want to brush my teeth.', ja: 'はを みがきたい。', ok: ['teeth'] })],
  [3, 5, 1, s => ({ key: 'tired', en: "I'm tired.", ja: 'つかれた…。', ok: ['bed', 'bath'] })],
  [3, 5, 1, s => { const h = rnd([8, 9, 10]); return { key: 'night', en: `It's ${h} p.m. Good night!`, ja: `よる ${h}じ。おやすみ！`, ok: ['bed'] }; }],
  [3, 5, 1, s => { const f = rnd(byCat('food')); return { key: 'want:' + f.id, en: `What do I want? I want ${f.a}!`, ja: `なにが ほしいかな？ ${f.ja}が ほしい！`, ok: [f.id] }; }],

  // ----- adult -----
  [4, 5, 2.5, s => { const [a, b] = two(rnd(['food', 'food', 'drink'])); return { key: 'dislike:' + b.id, en: `I don't like ${a.pl}. I want ${b.a}.`, ja: `${a.ja}は すきじゃない。${b.ja}が ほしい。`, ok: [b.id], avoid: { [a.id]: `No! I don't like ${a.pl}!` } }; }],
  [4, 5, 1.5, s => { const f = rnd(byCat('food')); return { key: 'want:' + f.id, en: `I want to eat ${f.a}.`, ja: `${f.ja}を たべたい。`, ok: [f.id] }; }],
  [4, 5, 1, s => { const d = rnd(byCat('drink')); return { key: 'want:' + d.id, en: `I want to drink ${d.a}.`, ja: `${d.ja}を のみたい。`, ok: [d.id] }; }],
  [4, 5, 2.5, s => { const r = rnd(PLACE_REASONS); return { key: 'reason:' + r.en, en: `I want to ${r.en}. Let's go!`, ja: `${r.ja}。いこう！`, ok: r.ok }; }],
  [4, 5, 2.5, s => { const d = rnd(DREAMS); return { key: 'dream:' + d.en, en: `I want to be ${d.en}!`, ja: `${d.ja}に なりたい！`, ok: d.ok }; }],
  [4, 5, 2, s => { const t = rnd(byCat('trip')); return { key: 'trip:' + t.id, en: `I want to go to ${t.en}.`, ja: `${t.ja}に いきたい。`, ok: [t.id] }; }],
  [4, 5, 2, s => { const r = rnd(TRIP_REASONS); return { key: 'tripr:' + r.en, en: `I want to ${r.en}.`, ja: `${r.ja}。`, ok: r.ok }; }],
  [4, 5, 1.5, s => { const t = rnd(byCat('study')); return { key: 'study:' + t.id, en: `My favorite subject is ${t.en}.`, ja: `すきな きょうかは ${t.ja}。`, ok: [t.id] }; }],
  [4, 5, 1, s => { const p = rnd(byCat('play').filter(i => i.sport)); return { key: 'play:' + p.id, en: `I like ${p.en}. Let's play!`, ja: `${p.ja}が すき。しよう！`, ok: [p.id] }; }],

  // ----- senior (past tense) -----
  [5, 5, 2.5, s => { const [a, b] = two('food'); return { key: 'past:' + b.id, en: `I ate ${a.a} yesterday. Today I want ${b.a}.`, ja: `きのう ${a.ja}を たべた。きょうは ${b.ja}が ほしい。`, ok: [b.id], avoid: { [a.id]: 'I ate it yesterday!' } }; }],
  [5, 5, 2.5, s => { const [a, b] = two('go'); return { key: 'pastgo:' + b.id, en: `I went to ${a.en} yesterday. Today I want to go to ${b.en}.`, ja: `きのう ${a.ja}に いった。きょうは ${b.ja}に いきたい。`, ok: [b.id], avoid: { [a.id]: 'I went there yesterday!' } }; }],
  [5, 5, 2, s => { const p = rnd(byCat('play').filter(i => i.sport)); return { key: 'pastplay:' + p.id, en: `I played ${p.en} yesterday. It was fun! Let's play again!`, ja: `きのう ${p.ja}を した。たのしかった！ また しよう！`, ok: [p.id] }; }],
  [5, 5, 1.5, s => { const t = rnd(byCat('trip')); return { key: 'pasttrip:' + t.id, en: `I went to ${t.en} when I was young. I want to go again!`, ja: `わかいころ ${t.ja}に いった。また いきたい！`, ok: [t.id] }; }],
  [5, 5, 1.5, s => ({ key: 'old', en: "I'm old. I'm tired.", ja: 'としを とって つかれた…。', ok: ['bed'] })],
];

let lastNeedKeys = [];
function makeNeed(stage) {
  const pool = NEEDS.filter(n => stage >= n[0] && stage <= n[1]);
  for (let tries = 0; tries < 40; tries++) {
    // weighted pick
    const total = pool.reduce((t, n) => t + n[2], 0);
    let r = Math.random() * total, chosen = pool[0];
    for (const n of pool) { r -= n[2]; if (r <= 0) { chosen = n; break; } }
    const need = chosen[3](stage);
    // every answer must be reachable with the buttons this stage has
    need.ok = need.ok.filter(id => unlocked(stage, ITEM[id].cat));
    if (!need.ok.length) continue;
    if (lastNeedKeys.includes(need.key)) continue;
    lastNeedKeys.push(need.key);
    if (lastNeedKeys.length > 4) lastNeedKeys.shift();
    need.en = need.en.replace(/\.\./g, '.').replace(/\.\?/g, '?').replace(/\.!/g, '!');
    need.tries = 0;
    return need;
  }
  return { key: 'hungry', en: "I'm hungry.", ja: 'おなかが すいた。', ok: ids('food'), tries: 0 };
}

function birthdayNeed(age) {
  return { key: 'birthday', en: `It's my birthday! I'm ${age} years old! I want cake!`, ja: `きょうは たんじょうび！ ${age}さいに なったよ！ ケーキが ほしい！`, ok: ['cake'], birthday: true, tries: 0 };
}
