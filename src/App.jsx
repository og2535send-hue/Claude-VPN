import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { applyTheme } from './styles/theme';
import AuthView from './views/AuthView.jsx';
import HomeView from './views/HomeView.jsx';
import LibraryView from './views/LibraryView.jsx';
import StoreView from './views/StoreView.jsx';
import ProfileView from './views/ProfileView.jsx';
import DownloadsView from './views/DownloadsView.jsx';
import FriendsView from './views/FriendsView.jsx';
import AchievementsView from './views/AchievementsView.jsx';
import SettingsView from './views/SettingsView.jsx';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import FriendsPanel from './components/FriendsPanel.jsx';
import Modal from './components/Modal.jsx';
import StatusBar from './components/StatusBar.jsx';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const activeView = useAppStore(s => s.activeView);
  const activeModal = useAppStore(s => s.activeModal);
  const tryAutoLogin = useAppStore(s => s.tryAutoLogin);
  const settings = useAppStore(s => s.settings);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    (async () => {
      try { await tryAutoLogin(); } catch (e) {}
      setBooted(true);
    })();
  }, []);

  useEffect(() => {
    if (settings && settings.theme) {
      applyTheme(settings.theme === 'auto' ? 'dark' : settings.theme, settings.accent_color, settings.font_size);
    }
  }, [settings]);

  if (!booted) {
    return <div className="auth-container"><div className="text-secondary">Загрузка...</div></div>;
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              {renderView(activeView)}
            </motion.div>
          </AnimatePresence>
        </main>
        <FriendsPanel />
      </div>
      <StatusBar />
      {activeModal && <Modal />}
    </div>
  );
}

function renderView(v) {
  switch (v) {
    case 'home': return <HomeView />;
    case 'library': return <LibraryView />;
    case 'store': return <StoreView />;
    case 'profile': return <ProfileView />;
    case 'downloads': return <DownloadsView />;
    case 'friends': return <FriendsView />;
    case 'achievements': return <AchievementsView />;
    case 'settings': return <SettingsView />;
    default: return <HomeView />;
  }
}
