import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaHome, FaGamepad, FaClock, FaStar, FaDownload, FaUsers, FaTrophy, FaCog } from 'react-icons/fa';

export default function Sidebar() {
  const activeView = useAppStore(s => s.activeView);
  const setActiveView = useAppStore(s => s.setActiveView);
  const currentUser = useAppStore(s => s.currentUser);
  const userGames = useAppStore(s => s.userGames);
  const friends = useAppStore(s => s.friends);
  const downloads = useAppStore(s => s.downloads);
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    window.electronAPI.getAppVersion().then(setVersion).catch(() => {});
  }, []);

  const favoritesCount = userGames.filter(g => g.is_favorite).length;
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'queued').length;
  const onlineFriends = friends.filter(f => f.status === 'accepted' && f.status !== 'offline').length;

  const items = (active) => [
    { key: 'home', icon: <FaHome />, label: 'Главная' },
    { key: 'library', icon: <FaGamepad />, label: 'Все игры', badge: userGames.length || null },
    { key: 'recent', icon: <FaClock />, label: 'Недавние' },
    { key: 'favorites', icon: <FaStar />, label: 'Избранное', badge: favoritesCount || null },
    { key: 'downloads', icon: <FaDownload />, label: 'Загрузки', badge: activeDownloads || null }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-user" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer' }}>
        <div className="avatar md" style={{ background: currentUser?.avatar_color }}>{currentUser?.avatar_initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{currentUser?.display_name}</div>
          <div className="sidebar-user-status">
            <span className={`status-dot ${currentUser?.status || 'online'}`}></span>
            {statusLabel(currentUser?.status)}
          </div>
        </div>
      </div>

      <div className="sidebar-section-title">Библиотека</div>
      {items().map(item => (
        <div
          key={item.key}
          className={`sidebar-item ${activeView === (item.key === 'recent' || item.key === 'favorites' ? 'library' : item.key) ? 'active' : ''}`}
          onClick={() => setActiveView(item.key === 'recent' || item.key === 'favorites' ? 'library' : item.key)}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge ? <span className="badge-inline">{item.badge}</span> : null}
        </div>
      ))}

      <div className="sidebar-section-title">Управление</div>
      <div className={`sidebar-item ${activeView === 'friends' ? 'active' : ''}`} onClick={() => setActiveView('friends')}>
        <FaUsers /> <span>Друзья</span>
        {onlineFriends > 0 && <span className="badge-inline">{onlineFriends}</span>}
      </div>
      <div className={`sidebar-item ${activeView === 'achievements' ? 'active' : ''}`} onClick={() => setActiveView('achievements')}>
        <FaTrophy /> <span>Достижения</span>
      </div>
      <div className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
        <FaCog /> <span>Настройки</span>
      </div>

      <div className="sidebar-footer">Steam Client v{version}</div>
    </aside>
  );
}

function statusLabel(s) {
  if (s === 'in_game') return 'В игре';
  if (s === 'offline') return 'Оффлайн';
  return 'Онлайн';
}
