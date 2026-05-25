const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  register: (username, displayName, password) => ipcRenderer.invoke('auth:register', username, displayName, password),
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  getUserById: (userId) => ipcRenderer.invoke('auth:getUserById', userId),

  // Profile
  getProfile: (userId) => ipcRenderer.invoke('profile:get', userId),
  updateProfile: (userId, fields) => ipcRenderer.invoke('profile:update', userId, fields),
  updateStatus: (userId, status) => ipcRenderer.invoke('profile:updateStatus', userId, status),
  updatePassword: (userId, oldPass, newPass) => ipcRenderer.invoke('profile:updatePassword', userId, oldPass, newPass),
  deleteAccount: (userId, password) => ipcRenderer.invoke('profile:delete', userId, password),

  // Games
  getGames: () => ipcRenderer.invoke('games:getAll'),
  getUserGames: (userId) => ipcRenderer.invoke('games:getUser', userId),
  addGameToLibrary: (userId, gameId) => ipcRenderer.invoke('games:addToLibrary', userId, gameId),
  removeGameFromLibrary: (userId, gameId) => ipcRenderer.invoke('games:removeFromLibrary', userId, gameId),
  toggleFavorite: (userId, gameId) => ipcRenderer.invoke('games:toggleFavorite', userId, gameId),
  toggleHidden: (userId, gameId) => ipcRenderer.invoke('games:toggleHidden', userId, gameId),
  updatePlaytime: (userId, gameId, hours) => ipcRenderer.invoke('games:updatePlaytime', userId, gameId, hours),
  launchGame: (userId, gameId) => ipcRenderer.invoke('games:launch', userId, gameId),

  // Achievements
  getAchievements: (gameId) => ipcRenderer.invoke('achievements:getForGame', gameId),
  getUserAchievements: (userId) => ipcRenderer.invoke('achievements:getForUser', userId),
  unlockAchievement: (userId, achievementId) => ipcRenderer.invoke('achievements:unlock', userId, achievementId),

  // Store
  searchGames: (query, filters) => ipcRenderer.invoke('store:search', query, filters),
  purchaseGame: (userId, gameId) => ipcRenderer.invoke('store:purchase', userId, gameId),

  // Friends
  getFriends: (userId) => ipcRenderer.invoke('friends:get', userId),
  sendFriendRequest: (userId, targetUsername) => ipcRenderer.invoke('friends:sendRequest', userId, targetUsername),
  acceptFriendRequest: (friendshipId) => ipcRenderer.invoke('friends:accept', friendshipId),
  removeFriend: (userId, friendId) => ipcRenderer.invoke('friends:remove', userId, friendId),
  searchUsers: (query) => ipcRenderer.invoke('friends:searchUser', query),

  // Messages
  getMessages: (userId, friendId) => ipcRenderer.invoke('messages:get', userId, friendId),
  sendMessage: (userId, receiverId, content) => ipcRenderer.invoke('messages:send', userId, receiverId, content),

  // Downloads
  getDownloads: (userId) => ipcRenderer.invoke('downloads:get', userId),
  addDownload: (userId, gameId) => ipcRenderer.invoke('downloads:add', userId, gameId),
  updateDownload: (downloadId, fields) => ipcRenderer.invoke('downloads:update', downloadId, fields),
  cancelDownload: (downloadId) => ipcRenderer.invoke('downloads:cancel', downloadId),
  pauseDownload: (downloadId) => ipcRenderer.invoke('downloads:update', downloadId, { status: 'paused' }),
  resumeDownload: (downloadId) => ipcRenderer.invoke('downloads:update', downloadId, { status: 'downloading' }),

  // Settings
  getSettings: (userId) => ipcRenderer.invoke('settings:get', userId),
  updateSettings: (userId, settings) => ipcRenderer.invoke('settings:update', userId, settings),

  // Activity
  getActivity: (userId, limit) => ipcRenderer.invoke('activity:get', userId, limit),

  // Window
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  setLoginItem: (enabled) => ipcRenderer.invoke('app:setLoginItem', enabled),

  // Subscriptions
  onTrayStatusChanged: (callback) => {
    const wrapped = (_e, status) => callback(status);
    ipcRenderer.on('tray:statusChanged', wrapped);
    return () => ipcRenderer.removeListener('tray:statusChanged', wrapped);
  }
});
