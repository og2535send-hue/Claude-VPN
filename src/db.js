const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

let db = null;

function initDb(userDataPath) {
  if (db) return db;

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'steam.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedGames();
  seedAchievements();

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb first.');
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#1b2838',
      avatar_initials TEXT,
      bio TEXT DEFAULT '',
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      status TEXT DEFAULT 'online',
      profile_theme TEXT DEFAULT 'default',
      profile_background TEXT DEFAULT '#1b2838',
      showcase_game_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_games (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      hours_played REAL DEFAULT 0,
      last_played TEXT,
      achievements_unlocked INTEGER DEFAULT 0,
      is_favorite INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      custom_tag TEXT DEFAULT '',
      added_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      tags TEXT,
      price REAL DEFAULT 0,
      discount INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      cover_color TEXT,
      cover_color2 TEXT,
      size_gb REAL DEFAULT 1,
      achievements_total INTEGER DEFAULT 0,
      developer TEXT,
      publisher TEXT,
      release_date TEXT,
      is_multiplayer INTEGER DEFAULT 0,
      is_coop INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      rarity TEXT DEFAULT 'common',
      xp_reward INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      sent_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      progress REAL DEFAULT 0,
      speed_mbps REAL DEFAULT 0,
      added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'dark',
      accent_color TEXT DEFAULT '#66c0f4',
      language TEXT DEFAULT 'ru',
      notifications_enabled INTEGER DEFAULT 1,
      download_limit_mbps REAL DEFAULT 0,
      startup_with_windows INTEGER DEFAULT 0,
      minimize_to_tray INTEGER DEFAULT 1,
      font_size TEXT DEFAULT 'medium',
      show_friends_online INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

const GAMES_SEED = [
  {
    id: 'gmod', title: "Garry's Mod", genre: 'Sandbox',
    tags: '["Multiplayer","Sandbox","Moddable"]',
    price: 299, discount: 0, rating: 4.9, reviews_count: 1250000,
    cover_color: '#1a3a5c', cover_color2: '#0a1f33', size_gb: 5.2,
    achievements_total: 100, is_multiplayer: 1, is_coop: 1,
    developer: 'Facepunch Studios', publisher: 'Valve', release_date: '2006-11-29',
    description: 'Garry\'s Mod — это физическая песочница. В отличие от обычных игр здесь нет цели, никаких квестов. Только вы и ваши идеи.'
  },
  {
    id: 'rust', title: 'Rust', genre: 'Survival',
    tags: '["Survival","Multiplayer","Open World"]',
    price: 999, discount: 25, rating: 4.2, reviews_count: 720000,
    cover_color: '#8b3a1a', cover_color2: '#4a1a08', size_gb: 12.8,
    achievements_total: 25, is_multiplayer: 1, is_coop: 1,
    developer: 'Facepunch Studios', publisher: 'Facepunch Studios', release_date: '2018-02-08',
    description: 'Единственная цель в Rust — выжить. Преодолевайте враждебную среду — голод, жажду, холод. Стройте укрытия, охотьтесь, сражайтесь с другими игроками.'
  },
  {
    id: 'subnautica', title: 'Subnautica', genre: 'Survival',
    tags: '["Survival","Exploration","Underwater"]',
    price: 699, discount: 0, rating: 4.8, reviews_count: 280000,
    cover_color: '#0a4a6e', cover_color2: '#052a3e', size_gb: 8.4,
    achievements_total: 60, is_multiplayer: 0, is_coop: 0,
    developer: 'Unknown Worlds', publisher: 'Unknown Worlds', release_date: '2018-01-23',
    description: 'Погрузитесь в подводное приключение на чужой планете. Исследуйте, постройте базу, выживайте среди ужасающих обитателей океана.'
  },
  {
    id: 'valheim', title: 'Valheim', genre: 'Survival',
    tags: '["Survival","Multiplayer","Viking"]',
    price: 599, discount: 0, rating: 4.7, reviews_count: 470000,
    cover_color: '#3a2a5c', cover_color2: '#1a1030', size_gb: 4.1,
    achievements_total: 120, is_multiplayer: 1, is_coop: 1,
    developer: 'Iron Gate AB', publisher: 'Coffee Stain Publishing', release_date: '2021-02-02',
    description: 'Survival и сэндбокс с упором на исследование, ремесло, строительство и битвы. Воссоздайте героические подвиги викингов в десятом мире.'
  },
  {
    id: 'l4d2', title: 'Left 4 Dead 2', genre: 'Action',
    tags: '["Coop","Shooter","Zombies"]',
    price: 199, discount: 50, rating: 4.9, reviews_count: 600000,
    cover_color: '#8b1a1a', cover_color2: '#4a0a0a', size_gb: 8.0,
    achievements_total: 69, is_multiplayer: 1, is_coop: 1,
    developer: 'Valve', publisher: 'Valve', release_date: '2009-11-17',
    description: 'Кооперативный шутер от первого лица. Сражайтесь с зомби-апокалипсисом вчетвером в кампаниях, наполненных экшеном.'
  },
  {
    id: 'drg', title: 'Deep Rock Galactic', genre: 'Shooter',
    tags: '["Coop","Shooter","Space"]',
    price: 549, discount: 0, rating: 4.9, reviews_count: 250000,
    cover_color: '#2a4a1a', cover_color2: '#0a1f08', size_gb: 7.8,
    achievements_total: 180, is_multiplayer: 1, is_coop: 1,
    developer: 'Ghost Ship Games', publisher: 'Coffee Stain Publishing', release_date: '2020-05-13',
    description: 'Кооперативный шутер на 1-4 игрока. Вы — космические гномы-шахтёры. Копайте, стройте, сражайтесь с инопланетными монстрами.'
  },
  {
    id: 'nms', title: "No Man's Sky", genre: 'Survival',
    tags: '["Survival","Exploration","Space"]',
    price: 1499, discount: 30, rating: 4.5, reviews_count: 200000,
    cover_color: '#1a3a1a', cover_color2: '#0a1f0a', size_gb: 15.6,
    achievements_total: 200, is_multiplayer: 1, is_coop: 1,
    developer: 'Hello Games', publisher: 'Hello Games', release_date: '2016-08-12',
    description: 'Бесконечная вселенная для исследования. 18 квинтиллионов планет, каждая со своей флорой, фауной и тайнами.'
  },
  {
    id: 'dst', title: "Don't Starve Together", genre: 'Survival',
    tags: '["Survival","Coop","Roguelike"]',
    price: 379, discount: 0, rating: 4.7, reviews_count: 360000,
    cover_color: '#1a1a0a', cover_color2: '#0d0d05', size_gb: 1.8,
    achievements_total: 100, is_multiplayer: 1, is_coop: 1,
    developer: 'Klei Entertainment', publisher: 'Klei Entertainment', release_date: '2016-04-21',
    description: 'Кооперативное многопользовательское расширение Don\'t Starve. Выживайте в загадочном мире вместе с друзьями.'
  },
  {
    id: 'portal2', title: 'Portal 2', genre: 'Puzzle',
    tags: '["Puzzle","Coop","Singleplayer"]',
    price: 249, discount: 75, rating: 5.0, reviews_count: 350000,
    cover_color: '#2a5a2a', cover_color2: '#0f2f0f', size_gb: 9.7,
    achievements_total: 51, is_multiplayer: 0, is_coop: 1,
    developer: 'Valve', publisher: 'Valve', release_date: '2011-04-19',
    description: 'Продолжение легендарной головоломки от Valve. Кооперативный режим, юмор, портальная пушка и злой ИИ GLaDOS.'
  },
  {
    id: 'terraria', title: 'Terraria', genre: 'Sandbox',
    tags: '["Sandbox","Survival","2D"]',
    price: 269, discount: 0, rating: 5.0, reviews_count: 1100000,
    cover_color: '#2a5c1a', cover_color2: '#0f2f0a', size_gb: 0.3,
    achievements_total: 412, is_multiplayer: 1, is_coop: 1,
    developer: 'Re-Logic', publisher: 'Re-Logic', release_date: '2011-05-16',
    description: '2D-приключенческая песочница. Копайте, сражайтесь, исследуйте, стройте. Бесконечные возможности.'
  },
  {
    id: 'theforest', title: 'The Forest', genre: 'Survival',
    tags: '["Survival","Horror","Coop"]',
    price: 449, discount: 0, rating: 4.6, reviews_count: 480000,
    cover_color: '#0a3a0a', cover_color2: '#051f05', size_gb: 5.9,
    achievements_total: 48, is_multiplayer: 1, is_coop: 1,
    developer: 'Endnight Games', publisher: 'Endnight Games', release_date: '2018-04-30',
    description: 'Survival-хоррор от первого лица. Выживите на острове, населённом каннибалами, после крушения самолёта.'
  },
  {
    id: 'greenhell', title: 'Green Hell', genre: 'Survival',
    tags: '["Survival","Realistic","Coop"]',
    price: 799, discount: 0, rating: 4.4, reviews_count: 110000,
    cover_color: '#1a3a0a', cover_color2: '#0a1f05', size_gb: 7.6,
    achievements_total: 79, is_multiplayer: 1, is_coop: 1,
    developer: 'Creepy Jar', publisher: 'Creepy Jar', release_date: '2019-09-05',
    description: 'Реалистичный симулятор выживания в джунглях Амазонии. Голод, болезни, психика — всё против вас.'
  },
];

function seedGames() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM games').get().c;
  if (count > 0) return;
  const insert = db.prepare(`
    INSERT INTO games (id, title, description, genre, tags, price, discount, rating, reviews_count,
      cover_color, cover_color2, size_gb, achievements_total, developer, publisher, release_date,
      is_multiplayer, is_coop)
    VALUES (@id, @title, @description, @genre, @tags, @price, @discount, @rating, @reviews_count,
      @cover_color, @cover_color2, @size_gb, @achievements_total, @developer, @publisher, @release_date,
      @is_multiplayer, @is_coop)
  `);
  const tx = db.transaction(() => {
    for (const g of GAMES_SEED) insert.run(g);
  });
  tx();
}

const ACHIEVEMENT_TEMPLATES = [
  { name: 'Первые шаги', desc: 'Запустите игру в первый раз', icon: '🎮', rarity: 'common', xp: 10 },
  { name: 'Час за часом', desc: 'Играйте 1 час', icon: '⏰', rarity: 'common', xp: 15 },
  { name: 'Преданный фанат', desc: 'Играйте 10 часов', icon: '⭐', rarity: 'rare', xp: 50 },
  { name: 'Мастер выживания', desc: 'Выживите ночью', icon: '🌙', rarity: 'rare', xp: 40 },
  { name: 'Коллекционер', desc: 'Соберите 100 предметов', icon: '💎', rarity: 'epic', xp: 100 },
  { name: 'Победитель', desc: 'Победите финального босса', icon: '👑', rarity: 'epic', xp: 150 },
  { name: 'Легенда', desc: 'Пройдите игру 100% на сложности «Кошмар»', icon: '🏆', rarity: 'legendary', xp: 500 },
  { name: 'Командный игрок', desc: 'Играйте в кооперативе 5 часов', icon: '🤝', rarity: 'rare', xp: 60 },
  { name: 'Исследователь', desc: 'Откройте все локации', icon: '🗺️', rarity: 'epic', xp: 120 },
  { name: 'Мастер крафта', desc: 'Создайте 50 предметов', icon: '🔨', rarity: 'rare', xp: 45 },
];

function seedAchievements() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM achievements').get().c;
  if (count > 0) return;
  const insert = db.prepare(`
    INSERT INTO achievements (id, game_id, name, description, icon, rarity, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const games = db.prepare('SELECT id FROM games').all();
  const tx = db.transaction(() => {
    for (const game of games) {
      for (const a of ACHIEVEMENT_TEMPLATES) {
        insert.run(uuidv4(), game.id, a.name, a.desc, a.icon, a.rarity, a.xp);
      }
    }
  });
  tx();
}

module.exports = { initDb, getDb };
