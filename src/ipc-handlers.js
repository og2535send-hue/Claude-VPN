const { ipcMain } = require('electron');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

function row(stmt, ...args) { return stmt.get(...args) || null; }

function parseGame(g) {
  if (!g) return g;
  try { g.tags = g.tags ? JSON.parse(g.tags) : []; } catch (e) { g.tags = []; }
  return g;
}

function userInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function register() {
  ipcMain.handle('auth:register', async (_e, username, displayName, password) => {
    try {
      const db = getDb();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return { success: false, error: 'Username должен быть 3-20 символов: a-z 0-9 _' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Пароль минимум 6 символов' };
      }
      const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (exists) return { success: false, error: 'Имя пользователя занято' };
      const id = uuidv4();
      const hash = bcrypt.hashSync(password, 10);
      const initials = userInitials(displayName || username);
      const colors = ['#1a44c9', '#c92d1a', '#1ac96d', '#c9a01a', '#a01ac9', '#1ac9c0', '#c91a85', '#ff7e5f'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      db.prepare(`INSERT INTO users (id, username, display_name, password_hash, avatar_color, avatar_initials)
        VALUES (?, ?, ?, ?, ?, ?)`).run(id, username, displayName || username, hash, avatarColor, initials);
      db.prepare(`INSERT INTO user_settings (user_id) VALUES (?)`).run(id);
      return { success: true, userId: id };
    } catch (err) {
      console.error('register error', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:login', async (_e, username, password) => {
    try {
      const db = getDb();
      const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!u) return { success: false, error: 'Пользователь не найден' };
      const ok = bcrypt.compareSync(password, u.password_hash);
      if (!ok) return { success: false, error: 'Неверный пароль' };
      delete u.password_hash;
      return { success: true, user: u };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:getUserById', async (_e, userId) => {
    try {
      const db = getDb();
      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!u) return null;
      delete u.password_hash;
      return u;
    } catch (err) { return null; }
  });

  // Profile
  ipcMain.handle('profile:get', async (_e, userId) => {
    try {
      const db = getDb();
      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!u) return null;
      delete u.password_hash;
      return u;
    } catch (err) { return null; }
  });

  ipcMain.handle('profile:update', async (_e, userId, fields) => {
    try {
      const db = getDb();
      const allowed = ['display_name', 'bio', 'avatar_color', 'avatar_initials', 'profile_theme', 'profile_background', 'showcase_game_id'];
      const map = {
        displayName: 'display_name',
        bio: 'bio',
        avatarColor: 'avatar_color',
        avatarInitials: 'avatar_initials',
        profileTheme: 'profile_theme',
        profileBackground: 'profile_background',
        showcaseGameId: 'showcase_game_id'
      };
      const sets = [];
      const vals = [];
      for (const [k, v] of Object.entries(fields || {})) {
        const col = map[k] || k;
        if (allowed.includes(col)) {
          sets.push(`${col} = ?`);
          vals.push(v);
        }
      }
      if (sets.length === 0) return { success: true };
      vals.push(userId);
      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('profile:updateStatus', async (_e, userId, status) => {
    try {
      const db = getDb();
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('profile:updatePassword', async (_e, userId, oldPass, newPass) => {
    try {
      const db = getDb();
      const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
      if (!u) return { success: false, error: 'Пользователь не найден' };
      if (!bcrypt.compareSync(oldPass, u.password_hash)) return { success: false, error: 'Старый пароль неверен' };
      if (!newPass || newPass.length < 6) return { success: false, error: 'Минимум 6 символов' };
      const hash = bcrypt.hashSync(newPass, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('profile:delete', async (_e, userId, password) => {
    try {
      const db = getDb();
      const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
      if (!u) return { success: false, error: 'Пользователь не найден' };
      if (!bcrypt.compareSync(password, u.password_hash)) return { success: false, error: 'Неверный пароль' };
      db.prepare('DELETE FROM user_games WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM friends WHERE user_id = ? OR friend_id = ?').run(userId, userId);
      db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(userId, userId);
      db.prepare('DELETE FROM downloads WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM activity_log WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Games
  ipcMain.handle('games:getAll', async () => {
    try {
      const db = getDb();
      return db.prepare('SELECT * FROM games').all().map(parseGame);
    } catch (err) { return []; }
  });

  ipcMain.handle('games:getUser', async (_e, userId) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT ug.*, g.title, g.description, g.genre, g.tags, g.price, g.discount, g.rating,
          g.cover_color, g.cover_color2, g.size_gb, g.achievements_total, g.developer,
          g.publisher, g.release_date, g.is_multiplayer, g.is_coop
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ?
      `).all(userId);
      return rows.map(parseGame);
    } catch (err) { return []; }
  });

  ipcMain.handle('games:addToLibrary', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      const ex = db.prepare('SELECT id FROM user_games WHERE user_id = ? AND game_id = ?').get(userId, gameId);
      if (ex) return { success: true };
      db.prepare('INSERT INTO user_games (id, user_id, game_id) VALUES (?, ?, ?)').run(uuidv4(), userId, gameId);
      logActivity(userId, 'purchase', { gameId });
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('games:removeFromLibrary', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM user_games WHERE user_id = ? AND game_id = ?').run(userId, gameId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('games:toggleFavorite', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      const ug = db.prepare('SELECT is_favorite FROM user_games WHERE user_id = ? AND game_id = ?').get(userId, gameId);
      if (!ug) return { isFavorite: false };
      const nv = ug.is_favorite ? 0 : 1;
      db.prepare('UPDATE user_games SET is_favorite = ? WHERE user_id = ? AND game_id = ?').run(nv, userId, gameId);
      return { isFavorite: !!nv };
    } catch (err) { return { isFavorite: false }; }
  });

  ipcMain.handle('games:toggleHidden', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      const ug = db.prepare('SELECT is_hidden FROM user_games WHERE user_id = ? AND game_id = ?').get(userId, gameId);
      if (!ug) return { isHidden: false };
      const nv = ug.is_hidden ? 0 : 1;
      db.prepare('UPDATE user_games SET is_hidden = ? WHERE user_id = ? AND game_id = ?').run(nv, userId, gameId);
      return { isHidden: !!nv };
    } catch (err) { return { isHidden: false }; }
  });

  ipcMain.handle('games:updatePlaytime', async (_e, userId, gameId, hours) => {
    try {
      const db = getDb();
      db.prepare(`UPDATE user_games SET hours_played = hours_played + ?, last_played = datetime('now')
        WHERE user_id = ? AND game_id = ?`).run(hours, userId, gameId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('games:launch', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      db.prepare(`UPDATE user_games SET last_played = datetime('now') WHERE user_id = ? AND game_id = ?`).run(userId, gameId);
      logActivity(userId, 'game_launch', { gameId });
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Achievements
  ipcMain.handle('achievements:getForGame', async (_e, gameId) => {
    try {
      const db = getDb();
      return db.prepare('SELECT * FROM achievements WHERE game_id = ?').all(gameId);
    } catch (err) { return []; }
  });

  ipcMain.handle('achievements:getForUser', async (_e, userId) => {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT ua.*, a.name, a.description, a.icon, a.rarity, a.xp_reward, a.game_id
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?
      `).all(userId);
    } catch (err) { return []; }
  });

  ipcMain.handle('achievements:unlock', async (_e, userId, achievementId) => {
    try {
      const db = getDb();
      const ex = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievementId);
      if (ex) return { success: false, error: 'Уже разблокировано' };
      const a = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achievementId);
      if (!a) return { success: false, error: 'Достижение не найдено' };
      db.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, achievementId);
      const xp = a.xp_reward || 10;
      const u = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId);
      let newXp = (u.xp || 0) + xp;
      let level = u.level || 1;
      while (newXp >= level * 100) {
        newXp -= level * 100;
        level += 1;
      }
      db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXp, level, userId);
      db.prepare('UPDATE user_games SET achievements_unlocked = achievements_unlocked + 1 WHERE user_id = ? AND game_id = ?').run(userId, a.game_id);
      logActivity(userId, 'achievement', { achievementId, gameId: a.game_id, name: a.name });
      return { success: true, xpGained: xp, newLevel: level };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Search
  ipcMain.handle('store:search', async (_e, query, filters) => {
    try {
      const db = getDb();
      let rows = db.prepare('SELECT * FROM games').all().map(parseGame);
      const q = (query || '').toLowerCase();
      if (q) rows = rows.filter(g => g.title.toLowerCase().includes(q));
      filters = filters || {};
      if (filters.genre && filters.genre !== 'all') rows = rows.filter(g => g.genre === filters.genre);
      if (filters.maxPrice != null) rows = rows.filter(g => (g.price * (100 - g.discount) / 100) <= filters.maxPrice);
      if (filters.tag) rows = rows.filter(g => g.tags.includes(filters.tag));
      if (filters.multiplayer) rows = rows.filter(g => g.is_multiplayer);
      if (filters.coop) rows = rows.filter(g => g.is_coop);
      if (filters.sort === 'price_asc') rows.sort((a, b) => a.price - b.price);
      else if (filters.sort === 'price_desc') rows.sort((a, b) => b.price - a.price);
      else if (filters.sort === 'rating') rows.sort((a, b) => b.rating - a.rating);
      return rows;
    } catch (err) { return []; }
  });

  ipcMain.handle('store:purchase', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      const ex = db.prepare('SELECT id FROM user_games WHERE user_id = ? AND game_id = ?').get(userId, gameId);
      if (ex) return { success: false, message: 'Игра уже в библиотеке' };
      db.prepare('INSERT INTO user_games (id, user_id, game_id) VALUES (?, ?, ?)').run(uuidv4(), userId, gameId);
      logActivity(userId, 'purchase', { gameId });
      return { success: true, message: 'Покупка успешна' };
    } catch (err) { return { success: false, message: err.message }; }
  });

  // Friends
  ipcMain.handle('friends:get', async (_e, userId) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT f.*, u.username, u.display_name, u.avatar_color, u.avatar_initials, u.status, u.level
        FROM friends f
        JOIN users u ON (
          (f.user_id = ? AND u.id = f.friend_id) OR
          (f.friend_id = ? AND u.id = f.user_id)
        )
        WHERE f.user_id = ? OR f.friend_id = ?
      `).all(userId, userId, userId, userId);
      return rows;
    } catch (err) { return []; }
  });

  ipcMain.handle('friends:sendRequest', async (_e, userId, targetUsername) => {
    try {
      const db = getDb();
      const target = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername);
      if (!target) return { success: false, error: 'Пользователь не найден' };
      if (target.id === userId) return { success: false, error: 'Нельзя добавить себя' };
      const ex = db.prepare(`SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`).get(userId, target.id, target.id, userId);
      if (ex) return { success: false, error: 'Запрос уже существует' };
      db.prepare('INSERT INTO friends (id, user_id, friend_id, status) VALUES (?, ?, ?, ?)').run(uuidv4(), userId, target.id, 'pending');
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('friends:accept', async (_e, friendshipId) => {
    try {
      const db = getDb();
      db.prepare('UPDATE friends SET status = ? WHERE id = ?').run('accepted', friendshipId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('friends:remove', async (_e, userId, friendId) => {
    try {
      const db = getDb();
      db.prepare(`DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`).run(userId, friendId, friendId, userId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('friends:searchUser', async (_e, query) => {
    try {
      const db = getDb();
      return db.prepare(`SELECT id, username, display_name, avatar_color, avatar_initials, level, status FROM users WHERE username LIKE ? LIMIT 20`).all(`%${query}%`);
    } catch (err) { return []; }
  });

  // Messages
  ipcMain.handle('messages:get', async (_e, userId, friendId) => {
    try {
      const db = getDb();
      return db.prepare(`SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY sent_at ASC`).all(userId, friendId, friendId, userId);
    } catch (err) { return []; }
  });

  ipcMain.handle('messages:send', async (_e, userId, receiverId, content) => {
    try {
      const db = getDb();
      const id = uuidv4();
      db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(id, userId, receiverId, content);
      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
      return { success: true, message: msg };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Downloads
  ipcMain.handle('downloads:get', async (_e, userId) => {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT d.*, g.title, g.cover_color, g.cover_color2, g.size_gb
        FROM downloads d
        JOIN games g ON d.game_id = g.id
        WHERE d.user_id = ?
        ORDER BY d.added_at DESC
      `).all(userId);
    } catch (err) { return []; }
  });

  ipcMain.handle('downloads:add', async (_e, userId, gameId) => {
    try {
      const db = getDb();
      db.prepare('INSERT INTO downloads (id, user_id, game_id, status) VALUES (?, ?, ?, ?)').run(uuidv4(), userId, gameId, 'downloading');
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('downloads:update', async (_e, downloadId, fields) => {
    try {
      const db = getDb();
      const allowed = ['status', 'progress', 'speed_mbps'];
      const sets = [];
      const vals = [];
      for (const [k, v] of Object.entries(fields || {})) {
        if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
      }
      if (sets.length) {
        vals.push(downloadId);
        db.prepare(`UPDATE downloads SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
      }
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  ipcMain.handle('downloads:cancel', async (_e, downloadId) => {
    try {
      const db = getDb();
      db.prepare('DELETE FROM downloads WHERE id = ?').run(downloadId);
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Settings
  ipcMain.handle('settings:get', async (_e, userId) => {
    try {
      const db = getDb();
      let s = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      if (!s) {
        db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
        s = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      }
      return s;
    } catch (err) { return null; }
  });

  ipcMain.handle('settings:update', async (_e, userId, settings) => {
    try {
      const db = getDb();
      const allowed = ['theme', 'accent_color', 'language', 'notifications_enabled',
        'download_limit_mbps', 'startup_with_windows', 'minimize_to_tray',
        'font_size', 'show_friends_online'];
      const sets = [];
      const vals = [];
      for (const [k, v] of Object.entries(settings || {})) {
        if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
      }
      if (sets.length) {
        vals.push(userId);
        db.prepare(`UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = ?`).run(...vals);
      }
      return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
  });

  // Activity log
  ipcMain.handle('activity:get', async (_e, userId, limit) => {
    try {
      const db = getDb();
      return db.prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit || 10);
    } catch (err) { return []; }
  });
}

function logActivity(userId, type, data) {
  try {
    const db = getDb();
    db.prepare('INSERT INTO activity_log (id, user_id, type, data) VALUES (?, ?, ?, ?)').run(uuidv4(), userId, type, JSON.stringify(data || {}));
  } catch (err) { console.error(err); }
}

module.exports = { register };
