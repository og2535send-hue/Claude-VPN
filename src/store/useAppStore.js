import { create } from 'zustand';

const REMEMBER_KEY = 'steam_client_remembered_user_id';

export const useAppStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,

  activeView: 'home',
  selectedGame: null,
  isFriendsPanelOpen: false,
  isSettingsOpen: false,
  activeModal: null,
  activeFriend: null,

  userGames: [],
  allGames: [],
  friends: [],
  downloads: [],
  settings: {},
  messages: {},
  unreadCounts: {},
  cart: [],
  activity: [],
  userAchievements: [],

  downloadProgress: {},

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  login: async (user, remember) => {
    if (remember) localStorage.setItem(REMEMBER_KEY, user.id);
    else localStorage.removeItem(REMEMBER_KEY);
    set({ currentUser: user, isAuthenticated: true });
    await get().loadUserData();
  },

  logout: () => {
    localStorage.removeItem(REMEMBER_KEY);
    set({
      currentUser: null,
      isAuthenticated: false,
      activeView: 'home',
      selectedGame: null,
      userGames: [],
      friends: [],
      downloads: [],
      messages: {},
      unreadCounts: {},
      cart: [],
      userAchievements: []
    });
  },

  tryAutoLogin: async () => {
    const id = localStorage.getItem(REMEMBER_KEY);
    if (!id) return false;
    try {
      const user = await window.electronAPI.getUserById(id);
      if (user) {
        set({ currentUser: user, isAuthenticated: true });
        await get().loadUserData();
        return true;
      }
    } catch (e) {}
    localStorage.removeItem(REMEMBER_KEY);
    return false;
  },

  setActiveView: (v) => set({ activeView: v, selectedGame: null }),
  setSelectedGame: (g) => set({ selectedGame: g }),
  toggleFriendsPanel: () => set({ isFriendsPanelOpen: !get().isFriendsPanelOpen }),
  setActiveFriend: (f) => set({ activeFriend: f }),
  openModal: (type, data) => set({ activeModal: { type, data } }),
  closeModal: () => set({ activeModal: null }),

  loadUserData: async () => {
    const user = get().currentUser;
    if (!user) return;
    try {
      const [userGames, allGames, friends, downloads, settings, activity, userAch] = await Promise.all([
        window.electronAPI.getUserGames(user.id),
        window.electronAPI.getGames(),
        window.electronAPI.getFriends(user.id),
        window.electronAPI.getDownloads(user.id),
        window.electronAPI.getSettings(user.id),
        window.electronAPI.getActivity(user.id, 10),
        window.electronAPI.getUserAchievements(user.id)
      ]);
      set({ userGames, allGames, friends, downloads, settings: settings || {}, activity, userAchievements: userAch });
    } catch (err) {
      console.error('loadUserData failed', err);
    }
  },

  refreshGames: async () => {
    const u = get().currentUser;
    if (!u) return;
    const [userGames, allGames] = await Promise.all([
      window.electronAPI.getUserGames(u.id),
      window.electronAPI.getGames()
    ]);
    set({ userGames, allGames });
  },

  refreshFriends: async () => {
    const u = get().currentUser;
    if (!u) return;
    set({ friends: await window.electronAPI.getFriends(u.id) });
  },

  refreshDownloads: async () => {
    const u = get().currentUser;
    if (!u) return;
    set({ downloads: await window.electronAPI.getDownloads(u.id) });
  },

  refreshActivity: async () => {
    const u = get().currentUser;
    if (!u) return;
    set({ activity: await window.electronAPI.getActivity(u.id, 10) });
  },

  refreshAchievements: async () => {
    const u = get().currentUser;
    if (!u) return;
    set({ userAchievements: await window.electronAPI.getUserAchievements(u.id) });
  },

  toggleFavorite: async (gameId) => {
    const u = get().currentUser;
    if (!u) return;
    await window.electronAPI.toggleFavorite(u.id, gameId);
    await get().refreshGames();
  },

  updateDownload: (id, fields) => {
    set((s) => ({
      downloadProgress: { ...s.downloadProgress, [id]: { ...(s.downloadProgress[id] || {}), ...fields } }
    }));
  },

  addToCart: (game) => {
    const cart = get().cart;
    if (cart.find(c => c.id === game.id)) return;
    set({ cart: [...cart, game] });
  },

  removeFromCart: (gameId) => set({ cart: get().cart.filter(c => c.id !== gameId) }),
  clearCart: () => set({ cart: [] }),

  loadMessages: async (friendId) => {
    const u = get().currentUser;
    if (!u) return;
    const msgs = await window.electronAPI.getMessages(u.id, friendId);
    set((s) => ({ messages: { ...s.messages, [friendId]: msgs } }));
  },

  sendMessage: async (friendId, content) => {
    const u = get().currentUser;
    if (!u) return;
    const res = await window.electronAPI.sendMessage(u.id, friendId, content);
    if (res.success) {
      set((s) => ({
        messages: { ...s.messages, [friendId]: [...(s.messages[friendId] || []), res.message] }
      }));
    }
  },

  applySettings: (settings) => set({ settings })
}));
