import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { applyTheme } from './styles/theme';

import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import FriendsPanel from './components/FriendsPanel';
import Modal from './components/Modal';
import StatusBar from './components/StatusBar';

import AuthView from './views/AuthView';
import HomeView from './views/HomeView';
import LibraryView from './views/LibraryView';
import StoreView from './views/StoreView';
import ProfileView from './views/ProfileView';
import DownloadsView from './views/DownloadsView';
import SettingsView from './views/SettingsView';
import AchievementsView from './views/AchievementsView';
import FriendsView from './views/FriendsView';

const VIEW_MAP = {
  home: HomeView,
  library: LibraryView,
  store: StoreView,
  profile: ProfileView,
  downloads: DownloadsView,
  settings: SettingsView,
  achievements: AchievementsView,
  friends: FriendsView,
};

export default function App() {
  const isAuth = useAppStore((s) => s.isAuthenticated);
  const activeView = useAppStore((s) => s.activeView);
  const settings = useAppStore((s) => s.settings);
  const isFriendsPanelOpen = useAppStore((s) => s.isFriendsPanelOpen);
  const activeModal = useAppStore((s) => s.activeModal);
  const toast = useAppStore((s) => s.toast);
  const tryAutoLogin = useAppStore((s) => s.tryAutoLogin);
  const [bootChecked, setBootChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await tryAutoLogin();
      } catch (e) {
        console.error('Auto-login failed', e);
      } finally {
        setBootChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (settings && settings.theme) {
      applyTheme(settings.theme, settings.accent_color, settings.font_size);
    }
  }, [settings.theme, settings.accent_color, settings.font_size]);

  useEffect(() => {
    if (!window.electronAPI?.onTrayStatusChange) return;
    window.electronAPI.onTrayStatusChange((status) => {
      useAppStore.getState().setStatus(status);
    });
  }, []);

  if (!bootChecked) {
    return (
      <div className="center" style={{ height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent)', fontSize: 18 }}>Загрузка...</div>
      </div>
    );
  }

  if (!isAuth) {
    return <AuthView />;
  }

  const ViewComponent = VIEW_MAP[activeView] || HomeView;

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <div className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              style={{ minHeight: '100%' }}
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </div>
        {isFriendsPanelOpen && <FriendsPanel />}
      </div>
      <StatusBar />
      {activeModal && <Modal />}
      {toast && (
        <motion.div
          className="toast"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}
