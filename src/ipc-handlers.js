const { ipcMain, BrowserWindow } = require('electron');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

function logActivity(userId, type, data) {
  try {
    const db = getDb();
    db.prepare(`INSERT INTO activity_log (id, user_id, type, data) VALUES (?, ?, ?, ?)`)
      .run(uuidv4(), userId, type, JSON.stringify(data || {}));
  } catch (e) { /* ignore */ }
}

function register(handle, fn) {
  ipcMain.handle(handle, async (event, ...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(`IPC ${handle} error:`, err);
      return { success: false, error: err.message };
    }
  });
}

function registerHandlers() {
  // ===== AUTH =====
  register('auth:register', async (username, displayName, password) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return { success: false, error: 'Имя пользователя уже занято' };

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    const initials = (displayName || username).slice(0, 2).toUpperCase();

    db.prepare(`
      INSERT INTO users (id, username, display_name, password_hash, avatar_initials)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, username, displayName, hash, initials);

    db.prepare(`INSERT INTO user_settings (user_id) VALUES (?)`).run(id);

    return { success: true, userId: id };
  });

  register('auth:login', async (username, password) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return { success: false, error: 'Пользователь не найден' };

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return { success: false, error: 'Неверный пароль' };

    delete user.password_hash;
    return { success: true, user };
  });

  register('auth:logout', async () => {
    return { success: true };
  });

  // ===== PROFILE =====
  register('profile:get', async (userId) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (user) delete user.password_hash;
    return user;
  });

  register('profile:update', async (userId, updates) => {
    const db = getDb();
    const allowed = ['display_name', 'displayName', 'bio', 'avatar_color', 'avatarColor',
      'avatar_initials', 'avatarInitials', 'profile_theme', 'profileTheme',
      'profile_background', 'profileBackground', 'showcase_game_id', 'showcaseGameId'];
    const map = {
      displayName: 'display_name',
      avatarColor: 'avatar_color',
      avatarInitials: 'avatar_initials',
      profileTheme: 'profile_theme',
      profileBackground: 'profile_background',
      showcaseGameId: 'showcase_game_id',
    };
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = map[k] || k;
      if (allowed.includes(col) || allowed.includes(k)) {
        fields.push(`${col} = ?`);
        values.push(v);
      }
    }
    if (!fields.length) return { success: true };
    values.push(userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return { success: true };
  });

  register('profile:updateStatus', async (userId, status) => {
    getDb().prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
    return { success: true };
  });

  register('profile:changePassword', async (userId, oldPassword, newPassword) => {
    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
    if (!user) return { success: false, error: 'Пользователь не найден' };
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) return { success: false, error: 'Неверный старый пароль' };
    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
    return { success: true };
  });

  register('profile:delete', async (userId, password) => {
    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
    if (!user) return { success: false, error: 'Пользователь не найден' };
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return { success: false, error: 'Неверный пароль' };
    db.prepare('DELETE FROM user_games WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_achievements WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM friends WHERE user_id = ? OR friend_id = ?').run(userId, userId);
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(userId, userId);
    db.prepare('DELETE FROM downloads WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM activity_log WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return { success: true };
  });

  // ===== GAMES =====
  register('games:getAll', async () => {
    return getDb().prepare('SELECT * FROM games ORDER BY rating DESC').all();
  });

  register('games:getUserGames', async (userId) => {
    return getDb().prepare(`
      SELECT ug.*, g.title, g.description, g.genre, g.tags, g.price, g.discount, g.rating,
             g.cover_color, g.cover_color2, g.size_gb, g.achievements_total, g.developer,
             g.publisher, g.release_date, g.is_multiplayer, g.is_coop
      FROM user_games ug
      JOIN games g ON g.id = ug.game_id
      WHERE ug.user_id = ?
      ORDER BY ug.last_played DESC
    `).all(userId);
  });

  register('games:addToLibrary', async (userId, gameId) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM user_games WHERE user_id = ? AND game_id = ?')
      .get(userId, gameId);
    if (existing) return { success: false, error: 'Игра уже в библиотеке' };
    db.prepare(`INSERT INTO user_games (id, user_id, game_id) VALUES (?, ?, ?)`)
      .run(uuidv4(), userId, gameId);
    logActivity(userId, 'purchase', { gameId });
    return { success: true };
  });

  register('games:removeFromLibrary', async (userId, gameId) => {
    getDb().prepare('DELETE FROM user_games WHERE user_id = ? AND game_id = ?').run(userId, gameId);
    return { success: true };
  });

  register('games:toggleFavorite', async (userId, gameId) => {
    const db = getDb();
    const row = db.prepare('SELECT is_favorite FROM user_games WHERE user_id = ? AND game_id = ?')
      .get(userId, gameId);
    if (!row) return { success: false, error: 'Игра не в библиотеке' };
    const newVal = row.is_favorite ? 0 : 1;
    db.prepare('UPDATE user_games SET is_favorite = ? WHERE user_id = ? AND game_id = ?')
      .run(newVal, userId, gameId);
    return { success: true, isFavorite: !!newVal };
  });

  register('games:toggleHidden', async (userId, gameId) => {
    const db = getDb();
    const row = db.prepare('SELECT is_hidden FROM user_games WHERE user_id = ? AND game_id = ?')
      .get(userId, gameId);
    if (!row) return { success: false };
    const newVal = row.is_hidden ? 0 : 1;
    db.prepare('UPDATE user_games SET is_hidden = ? WHERE user_id = ? AND game_id = ?')
      .run(newVal, userId, gameId);
    return { success: true, isHidden: !!newVal };
  });

  register('games:updatePlaytime', async (userId, gameId, hours) => {
    const db = getDb();
    db.prepare(`
      UPDATE user_games SET hours_played = hours_played + ?, last_played = datetime('now')
      WHERE user_id = ? AND game_id = ?
    `).run(hours, userId, gameId);
    return { success: true };
  });

  register('games:launch', async (userId, gameId) => {
    const db = getDb();
    db.prepare(`
      UPDATE user_games SET last_played = datetime('now')
      WHERE user_id = ? AND game_id = ?
    `).run(userId, gameId);
    logActivity(userId, 'game_launch', { gameId });
    return { success: true };
  });

  // ===== ACHIEVEMENTS =====
  register('achievements:getForGame', async (gameId) => {
    return getDb().prepare('SELECT * FROM achievements WHERE game_id = ?').all(gameId);
  });

  register('achievements:getUserUnlocked', async (userId) => {
    return getDb().prepare(`
      SELECT ua.*, a.game_id, a.name, a.description, a.icon, a.rarity, a.xp_reward
      FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `).all(userId);
  });

  register('achievements:unlock', async (userId, achievementId) => {
    const db = getDb();
    const existing = db.prepare('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ?')
      .get(userId, achievementId);
    if (existing) return { success: false, error: 'Уже разблокировано' };
    const ach = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achievementId);
    if (!ach) return { success: false, error: 'Достижение не найдено' };
    db.prepare(`INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`)
      .run(userId, achievementId);
    db.prepare(`UPDATE user_games SET achievements_unlocked = achievements_unlocked + 1
                WHERE user_id = ? AND game_id = ?`).run(userId, ach.game_id);
    const xpGained = ach.xp_reward || 10;
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xpGained, userId);
    // Level up by 100 XP
    const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId);
    const newLevel = Math.floor(user.xp / 100) + 1;
    if (newLevel > user.level) {
      db.prepare('UPDATE users SET level = ? WHERE id = ?').run(newLevel, userId);
    }
    logActivity(userId, 'achievement', { achievementId, name: ach.name });
    return { success: true, xpGained, newLevel };
  });

  // ===== STORE =====
  register('store:search', async (query, filters) => {
    const db = getDb();
    let sql = 'SELECT * FROM games WHERE 1=1';
    const params = [];
    if (query) {
      sql += ' AND LOWER(title) LIKE ?';
      params.push(`%${query.toLowerCase()}%`);
    }
    if (filters?.genre && filters.genre !== 'all') {
      sql += ' AND genre = ?';
      params.push(filters.genre);
    }
    if (filters?.maxPrice != null) {
      sql += ' AND (price * (100 - discount) / 100) <= ?';
      params.push(filters.maxPrice);
    }
    if (filters?.free) {
      sql += ' AND price = 0';
    }
    if (filters?.sortBy === 'price_asc') sql += ' ORDER BY (price * (100 - discount) / 100) ASC';
    else if (filters?.sortBy === 'price_desc') sql += ' ORDER BY (price * (100 - discount) / 100) DESC';
    else if (filters?.sortBy === 'rating') sql += ' ORDER BY rating DESC';
    else if (filters?.sortBy === 'new') sql += ' ORDER BY release_date DESC';
    else sql += ' ORDER BY reviews_count DESC';
    return db.prepare(sql).all(...params);
  });

  register('store:purchase', async (userId, gameId) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM user_games WHERE user_id = ? AND game_id = ?')
      .get(userId, gameId);
    if (existing) return { success: false, message: 'Игра уже в библиотеке' };
    db.prepare('INSERT INTO user_games (id, user_id, game_id) VALUES (?, ?, ?)')
      .run(uuidv4(), userId, gameId);
    db.prepare('INSERT INTO downloads (id, user_id, game_id, status) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), userId, gameId, 'queued');
    logActivity(userId, 'purchase', { gameId });
    return { success: true, message: 'Покупка успешна' };
  });

  // ===== FRIENDS =====
  register('friends:get', async (userId) => {
    return getDb().prepare(`
      SELECT f.*, u.username, u.display_name, u.avatar_color, u.avatar_initials,
             u.status, u.level
      FROM friends f
      JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
      ORDER BY u.status DESC, u.display_name ASC
    `).all(userId, userId, userId);
  });

  register('friends:getRequests', async (userId) => {
    const db = getDb();
    const incoming = db.prepare(`
      SELECT f.*, u.username, u.display_name, u.avatar_color, u.avatar_initials, 'incoming' AS direction
      FROM friends f JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `).all(userId);
    const outgoing = db.prepare(`
      SELECT f.*, u.username, u.display_name, u.avatar_color, u.avatar_initials, 'outgoing' AS direction
      FROM friends f JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ? AND f.status = 'pending'
    `).all(userId);
    return [...incoming, ...outgoing];
  });

  register('friends:searchUser', async (userId, query) => {
    return getDb().prepare(`
      SELECT id, username, display_name, avatar_color, avatar_initials, level
      FROM users
      WHERE id != ? AND (LOWER(username) LIKE ? OR LOWER(display_name) LIKE ?)
      LIMIT 20
    `).all(userId, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`);
  });

  register('friends:sendRequest', async (userId, targetUsername) => {
    const db = getDb();
    const target = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername);
    if (!target) return { success: false, error: 'Пользователь не найден' };
    if (target.id === userId) return { success: false, error: 'Нельзя добавить себя' };
    const existing = db.prepare(`
      SELECT id FROM friends
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(userId, target.id, target.id, userId);
    if (existing) return { success: false, error: 'Запрос уже отправлен или вы уже друзья' };
    db.prepare('INSERT INTO friends (id, user_id, friend_id, status) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), userId, target.id, 'pending');
    return { success: true };
  });

  register('friends:accept', async (friendshipId) => {
    const db = getDb();
    db.prepare('UPDATE friends SET status = ? WHERE id = ?').run('accepted', friendshipId);
    const row = db.prepare('SELECT user_id, friend_id FROM friends WHERE id = ?').get(friendshipId);
    if (row) {
      logActivity(row.friend_id, 'friend_add', { friendId: row.user_id });
      logActivity(row.user_id, 'friend_add', { friendId: row.friend_id });
    }
    return { success: true };
  });

  register('friends:reject', async (friendshipId) => {
    getDb().prepare('DELETE FROM friends WHERE id = ?').run(friendshipId);
    return { success: true };
  });

  register('friends:remove', async (userId, friendId) => {
    getDb().prepare(`
      DELETE FROM friends
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).run(userId, friendId, friendId, userId);
    return { success: true };
  });

  // ===== MESSAGES =====
  register('messages:get', async (userId, friendId) => {
    return getDb().prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY sent_at ASC
    `).all(userId, friendId, friendId, userId);
  });

  register('messages:send', async (userId, receiverId, content) => {
    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
      .run(id, userId, receiverId, content);
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return { success: true, message: msg };
  });

  register('messages:markRead', async (userId, friendId) => {
    getDb().prepare(`UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?`)
      .run(userId, friendId);
    return { success: true };
  });

  // ===== DOWNLOADS =====
  register('downloads:get', async (userId) => {
    return getDb().prepare(`
      SELECT d.*, g.title, g.cover_color, g.cover_color2, g.size_gb
      FROM downloads d JOIN games g ON g.id = d.game_id
      WHERE d.user_id = ?
      ORDER BY d.added_at DESC
    `).all(userId);
  });

  register('downloads:add', async (userId, gameId) => {
    getDb().prepare('INSERT INTO downloads (id, user_id, game_id, status) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), userId, gameId, 'queued');
    return { success: true };
  });

  register('downloads:updateProgress', async (downloadId, progress, speed) => {
    getDb().prepare('UPDATE downloads SET progress = ?, speed_mbps = ? WHERE id = ?')
      .run(progress, speed, downloadId);
    return { success: true };
  });

  register('downloads:setStatus', async (downloadId, status) => {
    getDb().prepare('UPDATE downloads SET status = ? WHERE id = ?').run(status, downloadId);
    return { success: true };
  });

  register('downloads:cancel', async (downloadId) => {
    getDb().prepare('DELETE FROM downloads WHERE id = ?').run(downloadId);
    return { success: true };
  });

  // ===== SETTINGS =====
  register('settings:get', async (userId) => {
    const db = getDb();
    let row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    if (!row) {
      db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
      row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    }
    return row;
  });

  register('settings:update', async (userId, settings) => {
    const db = getDb();
    const allowed = ['theme', 'accent_color', 'language', 'notifications_enabled',
      'download_limit_mbps', 'startup_with_windows', 'minimize_to_tray',
      'font_size', 'show_friends_online'];
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(settings)) {
      if (allowed.includes(k)) {
        fields.push(`${k} = ?`);
        values.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
      }
    }
    if (!fields.length) return { success: true };
    values.push(userId);
    db.prepare(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    return { success: true };
  });

  // ===== ACTIVITY =====
  register('activity:get', async (userId, limit) => {
    return getDb().prepare(`
      SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit || 10);
  });

  // ===== WINDOW =====
  ipcMain.on('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on('window:close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });
}

module.exports = { registerHandlers };
