// ============================================================
//  Tama Talk – vocabulary & request data
//  Words and patterns follow New Horizon Elementary 5 & 6
//  (I want ~ / I want to ~ / I'd like ~ / Let's ~ / I don't like ~ /
//   I want to be ~ / I want to go to ~ / I went to ~ / I ate ~ ...)
// ============================================================

// Categories in the button bar. "unlock" = life stage that shows it
// (1 baby, 2 child, 3 teen, 4 adult, 5 elder)
const CATEGORIES = [
  { id: 'food',  en: 'Food',  e: '🍙', unlock: 1 },
  { id: 'drink', en: 'Drink', e: '🥤', unlock: 1 },
  { id: 'play',  en: 'Play',  e: '⚽', unlock: 1 },
  { id: 'fun',   en: 'Fun',   e: '🎤', unlock: 2 },
  { id: 'wear',  en: 'Wear',  e: '👕', unlock: 2 },
  { id: 'study', en: 'Study', e: '✏️', unlock: 3 },
  { id: 'go',    en: 'Go',    e: '🗺️', unlock: 3 },
  { id: 'trip',  en: 'Trip',  e: '✈️', unlock: 4 },
  { id: 'clean', en: 'Clean', e: '🫧', unlock: 1 },
  { id: 'sleep', en: 'Sleep', e: '🛏️', unlock: 1, single: 'bed' },
  { id: 'hug',   en: 'Hug',   e: '🤗', unlock: 1, single: 'hug' },
];

// a  = form after "I want ..."   pl = form after "I like ..."
const ITEMS = [
  // ---------- FOOD ----------
  { id: 'apple', cat: 'food', e: '🍎', en: 'apple', a: 'an apple', pl: 'apples', ja: 'りんご' },
  { id: 'banana', cat: 'food', e: '🍌', en: 'banana', a: 'a banana', pl: 'bananas', ja: 'バナナ' },
  { id: 'orange', cat: 'food', e: '🍊', en: 'orange', a: 'an orange', pl: 'oranges', ja: 'オレンジ' },
  { id: 'strawberry', cat: 'food', e: '🍓', en: 'strawberries', a: 'strawberries', pl: 'strawberries', ja: 'いちご' },
  { id: 'grapes', cat: 'food', e: '🍇', en: 'grapes', a: 'grapes', pl: 'grapes', ja: 'ぶどう' },
  { id: 'melon', cat: 'food', e: '🍈', en: 'melon', a: 'a melon', pl: 'melons', ja: 'メロン' },
  { id: 'peach', cat: 'food', e: '🍑', en: 'peach', a: 'a peach', pl: 'peaches', ja: 'もも' },
  { id: 'tomato', cat: 'food', e: '🍅', en: 'tomato', a: 'a tomato', pl: 'tomatoes', ja: 'トマト' },
  { id: 'carrot', cat: 'food', e: '🥕', en: 'carrot', a: 'a carrot', pl: 'carrots', ja: 'にんじん' },
  { id: 'corn', cat: 'food', e: '🌽', en: 'corn', a: 'corn', pl: 'corn', ja: 'とうもろこし' },
  { id: 'cake', cat: 'food', e: '🍰', en: 'cake', a: 'cake', pl: 'cake', ja: 'ケーキ' },
  { id: 'icecream', cat: 'food', e: '🍦', en: 'ice cream', a: 'ice cream', pl: 'ice cream', ja: 'アイスクリーム' },
  { id: 'pizza', cat: 'food', e: '🍕', en: 'pizza', a: 'pizza', pl: 'pizza', ja: 'ピザ' },
  { id: 'spaghetti', cat: 'food', e: '🍝', en: 'spaghetti', a: 'spaghetti', pl: 'spaghetti', ja: 'スパゲッティ' },
  { id: 'curry', cat: 'food', e: '🍛', en: 'curry and rice', a: 'curry and rice', pl: 'curry and rice', ja: 'カレーライス' },
  { id: 'hamburger', cat: 'food', e: '🍔', en: 'hamburger', a: 'a hamburger', pl: 'hamburgers', ja: 'ハンバーガー' },
  { id: 'sandwich', cat: 'food', e: '🥪', en: 'sandwich', a: 'a sandwich', pl: 'sandwiches', ja: 'サンドイッチ' },
  { id: 'riceball', cat: 'food', e: '🍙', en: 'rice ball', a: 'a rice ball', pl: 'rice balls', ja: 'おにぎり' },
  { id: 'sushi', cat: 'food', e: '🍣', en: 'sushi', a: 'sushi', pl: 'sushi', ja: 'すし' },
  { id: 'ramen', cat: 'food', e: '🍜', en: 'ramen', a: 'ramen', pl: 'ramen', ja: 'ラーメン' },
  { id: 'salad', cat: 'food', e: '🥗', en: 'salad', a: 'salad', pl: 'salad', ja: 'サラダ' },
  { id: 'chicken', cat: 'food', e: '🍗', en: 'fried chicken', a: 'fried chicken', pl: 'fried chicken', ja: 'フライドチキン' },
  { id: 'fries', cat: 'food', e: '🍟', en: 'French fries', a: 'French fries', pl: 'French fries', ja: 'フライドポテト' },
  { id: 'hotdog', cat: 'food', e: '🌭', en: 'hot dog', a: 'a hot dog', pl: 'hot dogs', ja: 'ホットドッグ' },
  { id: 'donut', cat: 'food', e: '🍩', en: 'donut', a: 'a donut', pl: 'donuts', ja: 'ドーナツ' },
  { id: 'bread', cat: 'food', e: '🍞', en: 'bread', a: 'bread', pl: 'bread', ja: 'パン' },
  { id: 'steak', cat: 'food', e: '🥩', en: 'steak', a: 'steak', pl: 'steak', ja: 'ステーキ' },
  { id: 'pudding', cat: 'food', e: '🍮', en: 'pudding', a: 'pudding', pl: 'pudding', ja: 'プリン' },
  { id: 'shavedice', cat: 'food', e: '🍧', en: 'shaved ice', a: 'shaved ice', pl: 'shaved ice', ja: 'かきごおり' },
  { id: 'cookie', cat: 'food', e: '🍪', en: 'cookie', a: 'a cookie', pl: 'cookies', ja: 'クッキー' },
  { id: 'chocolate', cat: 'food', e: '🍫', en: 'chocolate', a: 'chocolate', pl: 'chocolate', ja: 'チョコレート' },

  // ---------- DRINK ----------
  { id: 'milk', cat: 'drink', e: '🥛', en: 'milk', a: 'milk', pl: 'milk', ja: 'ぎゅうにゅう' },
  { id: 'water', cat: 'drink', e: '💧', en: 'water', a: 'water', pl: 'water', ja: 'みず' },
  { id: 'juice', cat: 'drink', e: '🧃', en: 'orange juice', a: 'orange juice', pl: 'orange juice', ja: 'オレンジジュース' },
  { id: 'tea', cat: 'drink', e: '🍵', en: 'green tea', a: 'green tea', pl: 'green tea', ja: 'おちゃ' },
  { id: 'soda', cat: 'drink', e: '🥤', en: 'soda', a: 'soda', pl: 'soda', ja: 'ソーダ' },
  { id: 'cocoa', cat: 'drink', e: '☕', en: 'hot chocolate', a: 'hot chocolate', pl: 'hot chocolate', ja: 'ココア' },

  // ---------- PLAY (play ~) ----------
  { id: 'soccer', cat: 'play', e: '⚽', en: 'soccer', a: 'soccer', sport: 1, ja: 'サッカー', jaWant: 'サッカーを したい' },
  { id: 'baseball', cat: 'play', e: '⚾', en: 'baseball', a: 'baseball', sport: 1, ja: 'やきゅう', jaWant: 'やきゅうを したい' },
  { id: 'basketball', cat: 'play', e: '🏀', en: 'basketball', a: 'basketball', sport: 1, ja: 'バスケットボール', jaWant: 'バスケットボールを したい' },
  { id: 'tennis', cat: 'play', e: '🎾', en: 'tennis', a: 'tennis', sport: 1, ja: 'テニス', jaWant: 'テニスを したい' },
  { id: 'volleyball', cat: 'play', e: '🏐', en: 'volleyball', a: 'volleyball', sport: 1, ja: 'バレーボール', jaWant: 'バレーボールを したい' },
  { id: 'badminton', cat: 'play', e: '🏸', en: 'badminton', a: 'badminton', sport: 1, ja: 'バドミントン', jaWant: 'バドミントンを したい' },
  { id: 'tabletennis', cat: 'play', e: '🏓', en: 'table tennis', a: 'table tennis', sport: 1, ja: 'たっきゅう', jaWant: 'たっきゅうを したい' },
  { id: 'videogames', cat: 'play', e: '🎮', en: 'video games', a: 'video games', ja: 'テレビゲーム', jaWant: 'テレビゲームを したい' },
  { id: 'cards', cat: 'play', e: '🃏', en: 'cards', a: 'cards', ja: 'トランプ', jaWant: 'トランプを したい' },
  { id: 'piano', cat: 'play', e: '🎹', en: 'the piano', a: 'the piano', ja: 'ピアノ', jaWant: 'ピアノを ひきたい' },
  { id: 'guitar', cat: 'play', e: '🎸', en: 'the guitar', a: 'the guitar', ja: 'ギター', jaWant: 'ギターを ひきたい' },
  { id: 'drums', cat: 'play', e: '🥁', en: 'the drums', a: 'the drums', ja: 'ドラム', jaWant: 'ドラムを たたきたい' },

  // ---------- FUN (I want to ~) ----------
  { id: 'tv', cat: 'fun', e: '📺', en: 'watch TV', ja: 'テレビ', jaWant: 'テレビを みたい', done: 'I watched TV.' },
  { id: 'book', cat: 'fun', e: '📖', en: 'read a book', ja: 'ほん', jaWant: 'ほんを よみたい', done: 'I read a book.' },
  { id: 'sing', cat: 'fun', e: '🎤', en: 'sing', ja: 'うた', jaWant: 'うたを うたいたい', done: 'I sang a song.' },
  { id: 'dance', cat: 'fun', e: '💃', en: 'dance', ja: 'ダンス', jaWant: 'おどりたい', done: 'I danced.' },
  { id: 'draw', cat: 'fun', e: '🖍️', en: 'draw a picture', ja: 'え', jaWant: 'えを かきたい', done: 'I drew a picture.' },
  { id: 'cook', cat: 'fun', e: '🍳', en: 'cook', ja: 'りょうり', jaWant: 'りょうりを したい', done: 'I cooked.' },
  { id: 'swim', cat: 'fun', e: '🏊', en: 'swim', ja: 'すいえい', jaWant: 'およぎたい', done: 'I swam.' },
  { id: 'bike', cat: 'fun', e: '🚲', en: 'ride a bike', ja: 'じてんしゃ', jaWant: 'じてんしゃに のりたい', done: 'I rode a bike.' },
  { id: 'camera', cat: 'fun', e: '📷', en: 'take pictures', ja: 'しゃしん', jaWant: 'しゃしんを とりたい', done: 'I took pictures.' },
  { id: 'skate', cat: 'fun', e: '⛸️', en: 'skate', ja: 'スケート', jaWant: 'スケートを したい', done: 'I skated.' },

  // ---------- WEAR ----------
  { id: 'jacket', cat: 'wear', e: '🧥', en: 'jacket', a: 'a jacket', ja: 'ジャケット' },
  { id: 'scarf', cat: 'wear', e: '🧣', en: 'scarf', a: 'a scarf', ja: 'マフラー' },
  { id: 'gloves', cat: 'wear', e: '🧤', en: 'gloves', a: 'gloves', ja: 'てぶくろ' },
  { id: 'cap', cat: 'wear', e: '🧢', en: 'cap', a: 'a cap', ja: 'ぼうし' },
  { id: 'tshirt', cat: 'wear', e: '👕', en: 'T-shirt', a: 'a T-shirt', ja: 'Tシャツ' },
  { id: 'sunglasses', cat: 'wear', e: '🕶️', en: 'sunglasses', a: 'sunglasses', ja: 'サングラス' },
  { id: 'umbrella', cat: 'wear', e: '☂️', en: 'umbrella', a: 'an umbrella', ja: 'かさ' },
  { id: 'boots', cat: 'wear', e: '👢', en: 'boots', a: 'boots', ja: 'ブーツ' },

  // ---------- STUDY ----------
  { id: 'japanese', cat: 'study', e: '🇯🇵', en: 'Japanese', ja: 'こくご' },
  { id: 'english', cat: 'study', e: '🔤', en: 'English', ja: 'えいご' },
  { id: 'math', cat: 'study', e: '🔢', en: 'math', ja: 'さんすう' },
  { id: 'science', cat: 'study', e: '🔬', en: 'science', ja: 'りか' },
  { id: 'social', cat: 'study', e: '🗾', en: 'social studies', ja: 'しゃかい' },
  { id: 'music', cat: 'study', e: '🎵', en: 'music', ja: 'おんがく' },
  { id: 'pe', cat: 'study', e: '🤸', en: 'P.E.', ja: 'たいいく' },
  { id: 'arts', cat: 'study', e: '🎨', en: 'arts and crafts', ja: 'ずこう' },
  { id: 'homeec', cat: 'study', e: '🧵', en: 'home economics', ja: 'かていか' },
  { id: 'calligraphy', cat: 'study', e: '🖌️', en: 'calligraphy', ja: 'しょしゃ' },

  // ---------- GO (go to ~) ----------
  { id: 'park', cat: 'go', e: '🏞️', en: 'the park', ja: 'こうえん' },
  { id: 'library', cat: 'go', e: '📚', en: 'the library', ja: 'としょかん' },
  { id: 'zoo', cat: 'go', e: '🦁', en: 'the zoo', ja: 'どうぶつえん' },
  { id: 'aquarium', cat: 'go', e: '🐠', en: 'the aquarium', ja: 'すいぞくかん' },
  { id: 'sea', cat: 'go', e: '🏖️', en: 'the sea', ja: 'うみ' },
  { id: 'mountains', cat: 'go', e: '⛰️', en: 'the mountains', ja: 'やま' },
  { id: 'amusement', cat: 'go', e: '🎢', en: 'the amusement park', ja: 'ゆうえんち' },
  { id: 'conbini', cat: 'go', e: '🏪', en: 'the convenience store', ja: 'コンビニ' },
  { id: 'station', cat: 'go', e: '🚉', en: 'the station', ja: 'えき' },
  { id: 'postoffice', cat: 'go', e: '🏣', en: 'the post office', ja: 'ゆうびんきょく' },
  { id: 'museum', cat: 'go', e: '🦖', en: 'the museum', ja: 'はくぶつかん' },
  { id: 'school', cat: 'go', e: '🏫', en: 'school', ja: 'がっこう' },
  { id: 'shrine', cat: 'go', e: '⛩️', en: 'the shrine', ja: 'じんじゃ' },
  { id: 'bakery', cat: 'go', e: '🥐', en: 'the bakery', ja: 'パンや' },
  { id: 'supermarket', cat: 'go', e: '🛒', en: 'the supermarket', ja: 'スーパー' },
  { id: 'flowershop', cat: 'go', e: '💐', en: 'the flower shop', ja: 'はなや' },

  // ---------- TRIP (countries – always labelled) ----------
  { id: 'italy', cat: 'trip', e: '🇮🇹', label: 1, en: 'Italy', ja: 'イタリア' },
  { id: 'france', cat: 'trip', e: '🇫🇷', label: 1, en: 'France', ja: 'フランス' },
  { id: 'america', cat: 'trip', e: '🇺🇸', label: 1, en: 'America', ja: 'アメリカ' },
  { id: 'australia', cat: 'trip', e: '🇦🇺', label: 1, en: 'Australia', ja: 'オーストラリア' },
  { id: 'china', cat: 'trip', e: '🇨🇳', label: 1, en: 'China', ja: 'ちゅうごく' },
  { id: 'korea', cat: 'trip', e: '🇰🇷', label: 1, en: 'Korea', ja: 'かんこく' },
  { id: 'uk', cat: 'trip', e: '🇬🇧', label: 1, en: 'the U.K.', ja: 'イギリス' },
  { id: 'india', cat: 'trip', e: '🇮🇳', label: 1, en: 'India', ja: 'インド' },
  { id: 'egypt', cat: 'trip', e: '🇪🇬', label: 1, en: 'Egypt', ja: 'エジプト' },
  { id: 'brazil', cat: 'trip', e: '🇧🇷', label: 1, en: 'Brazil', ja: 'ブラジル' },
  { id: 'canada', cat: 'trip', e: '🇨🇦', label: 1, en: 'Canada', ja: 'カナダ' },
  { id: 'kenya', cat: 'trip', e: '🇰🇪', label: 1, en: 'Kenya', ja: 'ケニア' },

  // ---------- CLEAN ----------
  { id: 'bath', cat: 'clean', e: '🛁', en: 'take a bath', ja: 'おふろ' },
  { id: 'shower', cat: 'clean', e: '🚿', en: 'take a shower', ja: 'シャワー' },
  { id: 'teeth', cat: 'clean', e: '🪥', en: 'brush my teeth', ja: 'はみがき' },
  { id: 'hands', cat: 'clean', e: '🧼', en: 'wash my hands', ja: 'てあらい' },
  { id: 'cleanup', cat: 'clean', e: '🧹', en: 'clean up', ja: 'そうじ' },

  // ---------- single actions ----------
  { id: 'bed', cat: 'sleep', e: '🛏️', en: 'sleep', ja: 'ねる' },
  { id: 'hug', cat: 'hug', e: '🤗', en: 'hug', ja: 'ハグ' },
];

const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const byCat = c => ITEMS.filter(i => i.cat === c);

// "Let's go!" reasons  (adult)
const PLACE_REASONS = [
  { en: 'see animals', ja: 'どうぶつを みたい', ok: ['zoo'] },
  { en: 'see fish', ja: 'さかなを みたい', ok: ['aquarium'] },
  { en: 'read books', ja: 'ほんを よみたい', ok: ['library'] },
  { en: 'swim', ja: 'およぎたい', ok: ['sea', 'swim'] },
  { en: 'climb a mountain', ja: 'やまに のぼりたい', ok: ['mountains'] },
  { en: 'ride a roller coaster', ja: 'ジェットコースターに のりたい', ok: ['amusement'] },
  { en: 'buy bread', ja: 'パンを かいたい', ok: ['bakery', 'conbini', 'supermarket'] },
  { en: 'buy flowers', ja: 'はなを かいたい', ok: ['flowershop'] },
  { en: 'send a letter', ja: 'てがみを おくりたい', ok: ['postoffice'] },
  { en: 'take a train', ja: 'でんしゃに のりたい', ok: ['station'] },
  { en: 'see dinosaurs', ja: 'きょうりゅうを みたい', ok: ['museum'] },
  { en: 'see my friends', ja: 'ともだちに あいたい', ok: ['school', 'park'] },
  { en: 'buy vegetables', ja: 'やさいを かいたい', ok: ['supermarket'] },
  { en: 'play in the park', ja: 'こうえんで あそびたい', ok: ['park'] },
];

// "I want to be ~." (adult)  – NH6 "My dream"
const DREAMS = [
  { en: 'a soccer player', ja: 'サッカーせんしゅ', ok: ['soccer'] },
  { en: 'a baseball player', ja: 'やきゅうせんしゅ', ok: ['baseball'] },
  { en: 'a tennis player', ja: 'テニスせんしゅ', ok: ['tennis'] },
  { en: 'a basketball player', ja: 'バスケットボールせんしゅ', ok: ['basketball'] },
  { en: 'a pianist', ja: 'ピアニスト', ok: ['piano'] },
  { en: 'a singer', ja: 'かしゅ', ok: ['sing'] },
  { en: 'a dancer', ja: 'ダンサー', ok: ['dance'] },
  { en: 'a cook', ja: 'コック', ok: ['cook'] },
  { en: 'an artist', ja: 'がか', ok: ['draw', 'arts'] },
  { en: 'a scientist', ja: 'かがくしゃ', ok: ['science'] },
  { en: 'a zookeeper', ja: 'しいくいん', ok: ['zoo'] },
  { en: 'a swimmer', ja: 'すいえいせんしゅ', ok: ['swim'] },
  { en: 'a baker', ja: 'パンやさん', ok: ['bakery'] },
  { en: 'a florist', ja: 'はなやさん', ok: ['flowershop'] },
  { en: 'a photographer', ja: 'カメラマン', ok: ['camera'] },
  { en: 'a teacher', ja: 'せんせい', ok: ['school'] },
];

// "I want to see/eat ~." → country (adult/elder) – NH6 "Let's go to Italy"
const TRIP_REASONS = [
  { en: 'see the Colosseum', ja: 'コロッセオを みたい', ok: ['italy'] },
  { en: 'eat pizza in Italy', ja: 'イタリアで ピザを たべたい', ok: ['italy'] },
  { en: 'see the Eiffel Tower', ja: 'エッフェルとうを みたい', ok: ['france'] },
  { en: 'see the Statue of Liberty', ja: 'じゆうの めがみを みたい', ok: ['america'] },
  { en: 'see koalas and kangaroos', ja: 'コアラと カンガルーを みたい', ok: ['australia'] },
  { en: 'see the Great Wall', ja: 'ばんりの ちょうじょうを みたい', ok: ['china'] },
  { en: 'see pandas', ja: 'パンダを みたい', ok: ['china'] },
  { en: 'eat kimchi', ja: 'キムチを たべたい', ok: ['korea'] },
  { en: 'see Big Ben', ja: 'ビッグ・ベンを みたい', ok: ['uk'] },
  { en: 'eat fish and chips', ja: 'フィッシュ・アンド・チップスを たべたい', ok: ['uk'] },
  { en: 'see the Taj Mahal', ja: 'タージ・マハルを みたい', ok: ['india'] },
  { en: 'see the pyramids', ja: 'ピラミッドを みたい', ok: ['egypt'] },
  { en: 'see the Amazon River', ja: 'アマゾンがわを みたい', ok: ['brazil'] },
  { en: 'see Niagara Falls', ja: 'ナイアガラの たきを みたい', ok: ['canada', 'america'] },
  { en: 'see giraffes and zebras in Africa', ja: 'アフリカで キリンと シマウマを みたい', ok: ['kenya'] },
];

// What the tama says after you get it right
const THANKS = {
  food: ['Yummy!', 'Delicious! Thank you!', 'Mmm! I like it!', 'Yummy! I\'m full!'],
  drink: ['Ahh! Thank you!', 'Delicious!', 'Thank you! Yummy!'],
  play: ['That was fun!', 'Yay! I like {en}!', 'Fun! Thank you!'],
  fun: ['That was fun!', 'I enjoyed it!', '{done} It was fun!'],
  study: ['I studied {en}. I like {en}!', 'I learned a lot! Thank you!'],
  go: ['I went to {en}. It was fun!', 'I went to {en}! It was great!'],
  trip: ['I went to {en}! It was exciting!', 'I went to {en}. It was great!'],
  wear: ['Thank you! I like it!', 'Nice! Thank you!'],
  clean: ['I\'m clean! Thank you!', 'Sparkle, sparkle! Thank you!'],
  cleanup: ['Thank you! Sorry!'],
  sleep: ['Good morning!'],
  hug: ['Hehe! I\'m happy!', 'Thank you! I\'m happy now!'],
};

const NO_THANKS = ['No, thank you.', 'Hmm... no.', 'That\'s not it.', 'No, no!'];

// Life stages
const STAGES = [
  { id: 0, en: 'Egg', ja: 'たまご' },
  { id: 1, en: 'Baby', ja: 'あかちゃん', age: [0, 3] },
  { id: 2, en: 'Child', ja: 'こども', age: [3, 10] },
  { id: 3, en: 'Teen', ja: 'ティーン', age: [10, 20] },
  { id: 4, en: 'Adult', ja: 'おとな', age: [20, 60] },
  { id: 5, en: 'Senior', ja: 'おじいさん・おばあさん', age: [60, 100] },
];
// cares needed in each stage (×life length setting)
const STAGE_CARES = [0, 4, 6, 8, 9, 8];   // 35 wishes ≈ one week of daily visits (5 wishes saved up per day)

