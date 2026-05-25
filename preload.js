const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // Auth
  register: (username, displayName, password) =>
    ipcRenderer.invoke('auth:register', username, displayName, password),
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // Profile
  getProfile: (userId) => ipcRenderer.invoke('profile:get', userId),
  updateProfile: (userId, updates) => ipcRenderer.invoke('profile:update', userId, updates),
  updateStatus: (userId, status) => ipcRenderer.invoke('profile:updateStatus', userId, status),
  changePassword: (userId, oldPassword, newPassword) =>
    ipcRenderer.invoke('profile:changePassword', userId, oldPassword, newPassword),
  deleteAccount: (userId, password) => ipcRenderer.invoke('profile:delete', userId, password),

  // Games
  getGames: () => ipcRenderer.invoke('games:getAll'),
  getUserGames: (userId) => ipcRenderer.invoke('games:getUserGames', userId),
  addGameToLibrary: (userId, gameId) => ipcRenderer.invoke('games:addToLibrary', userId, gameId),
  removeGameFromLibrary: (userId, gameId) =>
    ipcRenderer.invoke('games:removeFromLibrary', userId, gameId),
  toggleFavorite: (userId, gameId) => ipcRenderer.invoke('games:toggleFavorite', userId, gameId),
  toggleHidden: (userId, gameId) => ipcRenderer.invoke('games:toggleHidden', userId, gameId),
  updatePlaytime: (userId, gameId, hours) =>
    ipcRenderer.invoke('games:updatePlaytime', userId, gameId, hours),
  launchGame: (userId, gameId) => ipcRenderer.invoke('games:launch', userId, gameId),

  // Achievements
  getAchievements: (gameId) => ipcRenderer.invoke('achievements:getForGame', gameId),
  getUserAchievements: (userId) => ipcRenderer.invoke('achievements:getUserUnlocked', userId),
  unlockAchievement: (userId, achievementId) =>
    ipcRenderer.invoke('achievements:unlock', userId, achievementId),

  // Store
  searchGames: (query, filters) => ipcRenderer.invoke('store:search', query, filters),
  purchaseGame: (userId, gameId) => ipcRenderer.invoke('store:purchase', userId, gameId),

  // Friends
  getFriends: (userId) => ipcRenderer.invoke('friends:get', userId),
  getFriendRequests: (userId) => ipcRenderer.invoke('friends:getRequests', userId),
  searchUsers: (userId, query) => ipcRenderer.invoke('friends:searchUser', userId, query),
  sendFriendRequest: (userId, targetUsername) =>
    ipcRenderer.invoke('friends:sendRequest', userId, targetUsername),
  acceptFriendRequest: (friendshipId) => ipcRenderer.invoke('friends:accept', friendshipId),
  rejectFriendRequest: (friendshipId) => ipcRenderer.invoke('friends:reject', friendshipId),
  removeFriend: (userId, friendId) => ipcRenderer.invoke('friends:remove', userId, friendId),

  // Messages
  getMessages: (userId, friendId) => ipcRenderer.invoke('messages:get', userId, friendId),
  sendMessage: (userId, receiverId, content) =>
    ipcRenderer.invoke('messages:send', userId, receiverId, content),
  markMessagesRead: (userId, friendId) =>
    ipcRenderer.invoke('messages:markRead', userId, friendId),

  // Downloads
  getDownloads: (userId) => ipcRenderer.invoke('downloads:get', userId),
  addDownload: (userId, gameId) => ipcRenderer.invoke('downloads:add', userId, gameId),
  updateDownloadProgress: (downloadId, progress, speed) =>
    ipcRenderer.invoke('downloads:updateProgress', downloadId, progress, speed),
  pauseDownload: (downloadId) => ipcRenderer.invoke('downloads:setStatus', downloadId, 'paused'),
  resumeDownload: (downloadId) =>
    ipcRenderer.invoke('downloads:setStatus', downloadId, 'downloading'),
  completeDownload: (downloadId) =>
    ipcRenderer.invoke('downloads:setStatus', downloadId, 'completed'),
  cancelDownload: (downloadId) => ipcRenderer.invoke('downloads:cancel', downloadId),

  // Settings
  getSettings: (userId) => ipcRenderer.invoke('settings:get', userId),
  updateSettings: (userId, settings) => ipcRenderer.invoke('settings:update', userId, settings),

  // Activity
  getActivity: (userId, limit) => ipcRenderer.invoke('activity:get', userId, limit),

  // App
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
  setStartup: (enabled) => ipcRenderer.invoke('app:setStartup', enabled),

  // Window
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Listeners
  onTrayStatusChange: (cb) => {
    ipcRenderer.on('tray:setStatus', (event, status) => cb(status));
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
