import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaSteam, FaBell, FaSearch, FaMinus, FaRegSquare, FaTimes } from 'react-icons/fa';

export default function TopBar() {
  const setActiveView = useAppStore(s => s.setActiveView);
  const activeView = useAppStore(s => s.activeView);
  const currentUser = useAppStore(s => s.currentUser);
  const userGames = useAppStore(s => s.userGames);
  const allGames = useAppStore(s => s.allGames);
  const setSelectedGame = useAppStore(s => s.setSelectedGame);
  const cart = useAppStore(s => s.cart);
  const friends = useAppStore(s => s.friends);
  const openModal = useAppStore(s => s.openModal);

  const [query, setQuery] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [status, setStatus] = useState(currentUser?.status || 'online');
  const searchRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setStatusOpen(false);
    try {
      await window.electronAPI.updateStatus(currentUser.id, newStatus);
    } catch (e) {}
  };

  const results = query.length > 0 ? combineSearch(query, userGames, allGames).slice(0, 8) : [];

  const unreadNotifs = friends.filter(f => f.status === 'pending' && f.friend_id === currentUser?.id).length;

  return (
    <div className="topbar">
      <div className="topbar-logo">
        <FaSteam size={18} color="var(--accent)" />
        <span>STEAM</span>
      </div>
      <div className="topbar-nav">
        <button className={activeView === 'store' ? 'active' : ''} onClick={() => setActiveView('store')}>МАГАЗИН</button>
        <button className={activeView === 'library' ? 'active' : ''} onClick={() => setActiveView('library')}>БИБЛИОТЕКА</button>
        <button disabled style={{ opacity: 0.5 }}>СООБЩЕСТВО</button>
        <button className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}>МОЙ ПРОФИЛЬ</button>
      </div>
      <div className="topbar-search" ref={searchRef}>
        <input
          placeholder="Поиск игр..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div className="search-dropdown">
            {results.map(g => (
              <div className="search-result" key={g.id} onClick={() => {
                setSelectedGame(g);
                setActiveView(g.inLibrary ? 'library' : 'store');
                setQuery('');
              }}>
                <div className="search-result-cover" style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}></div>
                <div className="flex-1">
                  <div style={{ color: 'var(--text_highlight)', fontSize: 13 }}>{g.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text_secondary)' }}>
                    {g.genre}{g.hours_played != null ? ` • ${g.hours_played.toFixed(1)}ч` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="topbar-right">
        <button className="topbar-notif" title="Уведомления">
          <FaBell />
          {unreadNotifs > 0 && <span className="badge">{unreadNotifs}</span>}
        </button>
        {cart.length > 0 && (
          <button className="topbar-notif" title="Корзина" onClick={() => openModal('cart')}>
            🛒
            <span className="badge">{cart.length}</span>
          </button>
        )}
        <div className="topbar-user" onClick={() => setActiveView('profile')}>
          <div className="avatar sm" style={{ background: currentUser?.avatar_color }}>{currentUser?.avatar_initials}</div>
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--text_highlight)' }}>{currentUser?.display_name}</div>
            <div style={{ color: 'var(--text_secondary)', fontSize: 10 }}>Уровень {currentUser?.level || 1}</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="topbar-status-btn" onClick={() => setStatusOpen(o => !o)}>
            <span className={`status-dot ${status}`}></span>
          </button>
          {statusOpen && (
            <div className="context-menu" style={{ right: 0, top: '36px' }}>
              <button className="context-menu-item" onClick={() => handleStatusChange('online')}>🟢 Онлайн</button>
              <button className="context-menu-item" onClick={() => handleStatusChange('in_game')}>🎮 В игре</button>
              <button className="context-menu-item" onClick={() => handleStatusChange('offline')}>⚫ Оффлайн</button>
            </div>
          )}
        </div>
      </div>
      <div className="window-controls">
        <button onClick={() => window.electronAPI.minimizeWindow()}><FaMinus size={10} /></button>
        <button onClick={() => window.electronAPI.maximizeWindow()}><FaRegSquare size={10} /></button>
        <button className="close" onClick={() => window.electronAPI.closeWindow()}><FaTimes size={12} /></button>
      </div>
    </div>
  );
}

function combineSearch(query, userGames, allGames) {
  const q = query.toLowerCase();
  const ugMap = new Map(userGames.map(g => [g.game_id, g]));
  const results = [];
  for (const ug of userGames) {
    if (ug.title.toLowerCase().includes(q)) {
      results.push({ ...ug, id: ug.game_id, inLibrary: true });
    }
  }
  for (const g of allGames) {
    if (ugMap.has(g.id)) continue;
    if (g.title.toLowerCase().includes(q)) {
      results.push({ ...g, inLibrary: false });
    }
  }
  return results;
}
