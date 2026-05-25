import { create } from 'zustand';

const REMEMBER_KEY = 'steamClient.rememberedUserId';

export const useAppStore = create((set, get) => ({
  // Auth
  currentUser: null,
  isAuthenticated: false,

  // UI
  activeView: 'home',
  selectedGame: null,
  isFriendsPanelOpen: false,
  isCartOpen: false,
  activeModal: null,
  toast: null,

  // Data
  userGames: [],
  allGames: [],
  friends: [],
  friendRequests: [],
  downloads: [],
  settings: {},
  achievements: [],
  userAchievements: [],
  activity: [],
  messages: {},
  unreadCounts: {},
  cart: [],
  activeChatFriend: null,
  selectedFriendId: null,

  // Actions
  login: async (user, remember) => {
    if (remember) localStorage.setItem(REMEMBER_KEY, user.id);
    set({ currentUser: user, isAuthenticated: true });
    await get().loadUserData();
  },

  logout: async () => {
    localStorage.removeItem(REMEMBER_KEY);
    if (window.electronAPI) await window.electronAPI.logout();
    set({
      currentUser: null,
      isAuthenticated: false,
      userGames: [],
      friends: [],
      downloads: [],
      activeView: 'home',
      selectedGame: null,
      messages: {},
      cart: [],
    });
  },

  tryAutoLogin: async () => {
    const userId = localStorage.getItem(REMEMBER_KEY);
    if (!userId) return false;
    const user = await window.electronAPI.getProfile(userId);
    if (user && user.id) {
      set({ currentUser: user, isAuthenticated: true });
      await get().loadUserData();
      return true;
    }
    localStorage.removeItem(REMEMBER_KEY);
    return false;
  },

  loadUserData: async () => {
    const user = get().currentUser;
    if (!user) return;
    const api = window.electronAPI;
    const [userGames, allGames, friends, friendRequests, downloads, settings, userAchievements, activity] =
      await Promise.all([
        api.getUserGames(user.id),
        api.getGames(),
        api.getFriends(user.id),
        api.getFriendRequests(user.id),
        api.getDownloads(user.id),
        api.getSettings(user.id),
        api.getUserAchievements(user.id),
        api.getActivity(user.id, 20),
      ]);
    set({ userGames, allGames, friends, friendRequests, downloads, settings, userAchievements, activity });
  },

  refreshUserGames: async () => {
    const user = get().currentUser;
    if (!user) return;
    const userGames = await window.electronAPI.getUserGames(user.id);
    set({ userGames });
  },

  refreshFriends: async () => {
    const user = get().currentUser;
    if (!user) return;
    const [friends, friendRequests] = await Promise.all([
      window.electronAPI.getFriends(user.id),
      window.electronAPI.getFriendRequests(user.id),
    ]);
    set({ friends, friendRequests });
  },

  refreshDownloads: async () => {
    const user = get().currentUser;
    if (!user) return;
    const downloads = await window.electronAPI.getDownloads(user.id);
    set({ downloads });
  },

  refreshAchievements: async () => {
    const user = get().currentUser;
    if (!user) return;
    const userAchievements = await window.electronAPI.getUserAchievements(user.id);
    set({ userAchievements });
  },

  refreshActivity: async () => {
    const user = get().currentUser;
    if (!user) return;
    const activity = await window.electronAPI.getActivity(user.id, 20);
    set({ activity });
  },

  refreshProfile: async () => {
    const user = get().currentUser;
    if (!user) return;
    const updated = await window.electronAPI.getProfile(user.id);
    set({ currentUser: updated });
  },

  setActiveView: (view) => set({ activeView: view, selectedGame: null }),
  setSelectedGame: (game) => set({ selectedGame: game }),
  toggleFriendsPanel: () => set((s) => ({ isFriendsPanelOpen: !s.isFriendsPanelOpen })),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  showToast: (message) => {
    set({ toast: { message, time: Date.now() } });
    setTimeout(() => {
      const t = get().toast;
      if (t && Date.now() - t.time >= 2900) set({ toast: null });
    }, 3000);
  },

  // Cart
  addToCart: (game) => set((s) => {
    if (s.cart.find((g) => g.id === game.id)) return s;
    return { cart: [...s.cart, game], isCartOpen: true };
  }),
  removeFromCart: (gameId) => set((s) => ({ cart: s.cart.filter((g) => g.id !== gameId) })),
  clearCart: () => set({ cart: [] }),

  // Messages
  loadMessages: async (friendId) => {
    const user = get().currentUser;
    if (!user) return;
    const msgs = await window.electronAPI.getMessages(user.id, friendId);
    set((s) => ({ messages: { ...s.messages, [friendId]: msgs } }));
    await window.electronAPI.markMessagesRead(user.id, friendId);
  },

  sendMessage: async (friendId, content) => {
    const user = get().currentUser;
    if (!user) return;
    const res = await window.electronAPI.sendMessage(user.id, friendId, content);
    if (res.success) {
      set((s) => ({
        messages: {
          ...s.messages,
          [friendId]: [...(s.messages[friendId] || []), res.message],
        },
      }));
    }
  },

  setActiveChatFriend: (friend) => set({ activeChatFriend: friend }),
  setSelectedFriendId: (id) => set({ selectedFriendId: id }),

  // Status
  setStatus: async (status) => {
    const user = get().currentUser;
    if (!user) return;
    await window.electronAPI.updateStatus(user.id, status);
    set({ currentUser: { ...user, status } });
  },
}));
