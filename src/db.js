const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

let db = null;

function init(userDataPath) {
  const dbPath = path.join(userDataPath, 'steam.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  seedGames();
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
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

const SEED_GAMES = [
  {
    id: 'gmod', title: "Garry's Mod", genre: 'Sandbox',
    tags: ["Multiplayer", "Sandbox", "Moddable"], price: 2990, discount: 0, rating: 4.9,
    cover_color: '#1a3a5c', cover_color2: '#0a1f33', size_gb: 5.2, achievements_total: 100,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Facepunch Studios', publisher: 'Valve', release_date: '2006-11-29',
    description: 'Песочница без правил. Создавайте миры, играйте моды, веселитесь с друзьями.'
  },
  {
    id: 'rust', title: "Rust", genre: 'Survival',
    tags: ["Survival", "Multiplayer", "Open World"], price: 999, discount: 25, rating: 4.2,
    cover_color: '#8b3a1a', cover_color2: '#4a1a08', size_gb: 12.8, achievements_total: 25,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Facepunch Studios', publisher: 'Facepunch', release_date: '2018-02-08',
    description: 'Жестокое выживание на открытом сервере. Строй базу, защищайся, побеждай.'
  },
  {
    id: 'subnautica', title: "Subnautica", genre: 'Survival',
    tags: ["Survival", "Exploration", "Underwater"], price: 6990, discount: 0, rating: 4.8,
    cover_color: '#0a4a6e', cover_color2: '#052a3e', size_gb: 8.4, achievements_total: 60,
    is_multiplayer: 0, is_coop: 0,
    developer: 'Unknown Worlds', publisher: 'Unknown Worlds', release_date: '2018-01-23',
    description: 'Исследуйте загадочный океан чужой планеты. Стройте базы, охотьтесь, выживайте.'
  },
  {
    id: 'valheim', title: "Valheim", genre: 'Survival',
    tags: ["Survival", "Multiplayer", "Viking"], price: 599, discount: 0, rating: 4.7,
    cover_color: '#3a2a5c', cover_color2: '#1a1030', size_gb: 4.1, achievements_total: 12,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Iron Gate', publisher: 'Coffee Stain', release_date: '2021-02-02',
    description: 'Викингское выживание в загробном мире. Стройте, сражайтесь, плавайте.'
  },
  {
    id: 'l4d2', title: "Left 4 Dead 2", genre: 'Action',
    tags: ["Coop", "Shooter", "Zombies"], price: 199, discount: 50, rating: 4.9,
    cover_color: '#8b1a1a', cover_color2: '#4a0a0a', size_gb: 8.0, achievements_total: 69,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Valve', publisher: 'Valve', release_date: '2009-11-17',
    description: 'Кооперативный шутер про зомби-апокалипсис. Бегите, стреляйте, выживайте.'
  },
  {
    id: 'drg', title: "Deep Rock Galactic", genre: 'Shooter',
    tags: ["Coop", "Shooter", "Space"], price: 549, discount: 0, rating: 4.9,
    cover_color: '#2a4a1a', cover_color2: '#0a1f08', size_gb: 7.8, achievements_total: 180,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Ghost Ship Games', publisher: 'Coffee Stain', release_date: '2020-05-13',
    description: 'Кооперативная добыча минералов в космосе. Гномы, пушки, пещеры.'
  },
  {
    id: 'nms', title: "No Man's Sky", genre: 'Survival',
    tags: ["Survival", "Exploration", "Space"], price: 1499, discount: 30, rating: 4.5,
    cover_color: '#1a3a1a', cover_color2: '#0a1f0a', size_gb: 15.6, achievements_total: 200,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Hello Games', publisher: 'Hello Games', release_date: '2016-08-12',
    description: 'Бесконечная вселенная процедурно сгенерированных планет. Исследуй и стройся.'
  },
  {
    id: 'dst', title: "Don't Starve Together", genre: 'Survival',
    tags: ["Survival", "Coop", "Roguelike"], price: 379, discount: 0, rating: 4.7,
    cover_color: '#1a1a0a', cover_color2: '#0d0d05', size_gb: 1.8, achievements_total: 100,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Klei Entertainment', publisher: 'Klei', release_date: '2016-04-21',
    description: 'Тёмное мультиплеерное выживание. Не голодай, не умирай, твори безумие.'
  },
  {
    id: 'portal2', title: "Portal 2", genre: 'Puzzle',
    tags: ["Puzzle", "Coop", "Singleplayer"], price: 249, discount: 75, rating: 5.0,
    cover_color: '#2a5a2a', cover_color2: '#0f2f0f', size_gb: 9.7, achievements_total: 51,
    is_multiplayer: 0, is_coop: 1,
    developer: 'Valve', publisher: 'Valve', release_date: '2011-04-19',
    description: 'Легендарная головоломка с порталами. Один из лучших платформер-пазлов в истории.'
  },
  {
    id: 'terraria', title: "Terraria", genre: 'Sandbox',
    tags: ["Sandbox", "Survival", "2D"], price: 269, discount: 0, rating: 5.0,
    cover_color: '#2a5c1a', cover_color2: '#0f2f0a', size_gb: 0.3, achievements_total: 412,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Re-Logic', publisher: 'Re-Logic', release_date: '2011-05-16',
    description: '2D-приключение в гигантском мире. Копай, строй, сражайся с боссами.'
  },
  {
    id: 'theforest', title: "The Forest", genre: 'Survival',
    tags: ["Survival", "Horror", "Coop"], price: 449, discount: 0, rating: 4.6,
    cover_color: '#0a3a0a', cover_color2: '#051f05', size_gb: 5.9, achievements_total: 48,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Endnight Games', publisher: 'Endnight', release_date: '2018-04-30',
    description: 'Хоррор-выживание в лесу полном каннибалов. Стройте, копайте, выживайте.'
  },
  {
    id: 'greenhell', title: "Green Hell", genre: 'Survival',
    tags: ["Survival", "Realistic", "Coop"], price: 799, discount: 0, rating: 4.4,
    cover_color: '#1a3a0a', cover_color2: '#0a1f05', size_gb: 7.6, achievements_total: 79,
    is_multiplayer: 1, is_coop: 1,
    developer: 'Creepy Jar', publisher: 'Creepy Jar', release_date: '2019-09-05',
    description: 'Реалистичное выживание в амазонских джунглях. Знай растения, лечи раны.'
  }
];

const ACHIEVEMENT_TEMPLATES = [
  { icon: '🎯', name: 'Первый шаг', desc: 'Запустите игру впервые', rarity: 'common', xp: 10 },
  { icon: '⏰', name: 'Час игры', desc: 'Сыграйте 1 час', rarity: 'common', xp: 15 },
  { icon: '🌟', name: 'Десять часов', desc: 'Сыграйте 10 часов', rarity: 'rare', xp: 30 },
  { icon: '💯', name: 'Сотня', desc: 'Сыграйте 100 часов', rarity: 'epic', xp: 100 },
  { icon: '👑', name: 'Легенда', desc: 'Сыграйте 1000 часов', rarity: 'legendary', xp: 500 },
  { icon: '🏆', name: 'Победитель', desc: 'Завершите главное задание', rarity: 'rare', xp: 50 },
  { icon: '💎', name: 'Коллекционер', desc: 'Соберите редкие предметы', rarity: 'epic', xp: 75 },
  { icon: '⚔️', name: 'Воин', desc: 'Победите 100 врагов', rarity: 'common', xp: 20 },
  { icon: '🔥', name: 'На огне', desc: 'Выполните 5 заданий подряд', rarity: 'rare', xp: 40 },
  { icon: '🚀', name: 'Скоростной', desc: 'Пройдите задание быстрее всех', rarity: 'epic', xp: 80 }
];

function seedGames() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM games').get().c;
  if (count > 0) return;
  const insertGame = db.prepare(`
    INSERT INTO games (id, title, description, genre, tags, price, discount, rating, reviews_count,
      cover_color, cover_color2, size_gb, achievements_total, developer, publisher, release_date,
      is_multiplayer, is_coop)
    VALUES (@id, @title, @description, @genre, @tags, @price, @discount, @rating, @reviews_count,
      @cover_color, @cover_color2, @size_gb, @achievements_total, @developer, @publisher,
      @release_date, @is_multiplayer, @is_coop)
  `);
  const insertAch = db.prepare(`
    INSERT INTO achievements (id, game_id, name, description, icon, rarity, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const g of SEED_GAMES) {
      insertGame.run({
        ...g,
        tags: JSON.stringify(g.tags),
        reviews_count: Math.floor(Math.random() * 50000) + 5000
      });
      // Achievements per game
      ACHIEVEMENT_TEMPLATES.forEach((a, i) => {
        insertAch.run(`${g.id}_ach_${i}`, g.id, a.name, a.desc, a.icon, a.rarity, a.xp);
      });
    }
  });
  tx();
}

module.exports = { init, getDb };
