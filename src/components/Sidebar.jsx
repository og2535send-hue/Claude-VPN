import React, { useEffect, useState } from 'react';
import {
  FaHome, FaGamepad, FaClock, FaStar, FaDownload,
  FaUserFriends, FaTrophy, FaCog,
} from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function Sidebar() {
  const user = useAppStore((s) => s.currentUser);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const userGames = useAppStore((s) => s.userGames);
  const friends = useAppStore((s) => s.friends);
  const downloads = useAppStore((s) => s.downloads);
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(setAppVersion).catch(() => {});
    }
  }, []);

  const favCount = userGames.filter((g) => g.is_favorite).length;
  const activeDownloads = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'paused'
  ).length;
  const friendsOnline = friends.filter((f) => f.status === 'online' || f.status === 'in-game').length;

  const items = [
    { key: 'home', icon: <FaHome />, label: 'Главная' },
    { key: 'library', icon: <FaGamepad />, label: 'Все игры', badge: userGames.length },
    { key: 'library-recent', icon: <FaClock />, label: 'Недавние' },
    { key: 'library-fav', icon: <FaStar />, label: 'Избранное', badge: favCount },
    { key: 'downloads', icon: <FaDownload />, label: 'Загрузки', badge: activeDownloads },
  ];

  const itemsBottom = [
    { key: 'friends', icon: <FaUserFriends />, label: 'Друзья', badge: friendsOnline },
    { key: 'achievements', icon: <FaTrophy />, label: 'Достижения' },
    { key: 'settings', icon: <FaCog />, label: 'Настройки' },
  ];

  const handleNav = (key) => {
    if (key === 'library-recent' || key === 'library-fav') {
      setActiveView('library');
    } else {
      setActiveView(key);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-user">
        <div
          className="avatar md"
          style={{ background: user?.avatar_color || '#1a44c9' }}
        >
          {user?.avatar_initials || '?'}
        </div>
        <div style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>
          {user?.display_name}
        </div>
        <div className="text-small text-secondary">
          <span className={`status-dot ${user?.status || 'online'}`} /> {' '}
          Уровень {user?.level || 1}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Библиотека</div>
        {items.map((item) => (
          <div
            key={item.key}
            className={`sidebar-item ${activeView === item.key || (item.key === 'library' && activeView === 'library') ? 'active' : ''}`}
            onClick={() => handleNav(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="badge">{item.badge}</span>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Управление</div>
        {itemsBottom.map((item) => (
          <div
            key={item.key}
            className={`sidebar-item ${activeView === item.key ? 'active' : ''}`}
            onClick={() => handleNav(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="badge">{item.badge}</span>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">v{appVersion}</div>
    </div>
  );
}
