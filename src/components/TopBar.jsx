import React, { useState, useEffect, useRef } from 'react';
import { FaSteam, FaBell, FaShoppingCart } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function TopBar() {
  const user = useAppStore((s) => s.currentUser);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedGame = useAppStore((s) => s.setSelectedGame);
  const allGames = useAppStore((s) => s.allGames);
  const userGames = useAppStore((s) => s.userGames);
  const cart = useAppStore((s) => s.cart);
  const toggleCart = useAppStore((s) => s.toggleCart);
  const friendRequests = useAppStore((s) => s.friendRequests);
  const setStatus = useAppStore((s) => s.setStatus);

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const incoming = (friendRequests || []).filter((r) => r.direction === 'incoming').length;

  const ownedIds = new Set((userGames || []).map((g) => g.game_id));
  const filtered = search
    ? allGames
        .filter((g) => g.title.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8)
    : [];

  const onSelectGame = (game) => {
    setSearch('');
    setShowDropdown(false);
    if (ownedIds.has(game.id)) {
      setActiveView('library');
      const ug = userGames.find((u) => u.game_id === game.id);
      setSelectedGame(ug);
    } else {
      setActiveView('store');
      useAppStore.getState().openModal({ type: 'game-store', data: game });
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-logo">
        <FaSteam size={20} color="var(--accent)" />
        <span>STEAM</span>
      </div>

      <div className="topbar-menu">
        <button
          className={activeView === 'store' ? 'active' : ''}
          onClick={() => setActiveView('store')}
        >
          МАГАЗИН
        </button>
        <button
          className={activeView === 'library' ? 'active' : ''}
          onClick={() => setActiveView('library')}
        >
          БИБЛИОТЕКА
        </button>
        <button disabled style={{ opacity: 0.5 }}>СООБЩЕСТВО</button>
        <button
          className={activeView === 'profile' ? 'active' : ''}
          onClick={() => setActiveView('profile')}
        >
          МОЙ ПРОФИЛЬ
        </button>
      </div>

      <div className="search-wrapper" ref={searchRef}>
        <input
          className="search-input"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        {showDropdown && filtered.length > 0 && (
          <div className="search-dropdown">
            {filtered.map((g) => {
              const ug = userGames.find((u) => u.game_id === g.id);
              return (
                <div
                  key={g.id}
                  className="search-result"
                  onClick={() => onSelectGame(g)}
                >
                  <div
                    className="search-cover"
                    style={{
                      background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-highlight)' }}>{g.title}</div>
                    <div className="text-small text-secondary">
                      {g.genre} {ug ? `• ${(ug.hours_played || 0).toFixed(1)} ч.` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="bell" onClick={() => setActiveView('friends')} title="Уведомления">
          <FaBell />
          {incoming > 0 && <span className="bell-badge">{incoming}</span>}
        </div>

        <div className="bell" onClick={toggleCart} title="Корзина">
          <FaShoppingCart />
          {cart.length > 0 && <span className="bell-badge">{cart.length}</span>}
        </div>

        <div className="user-area" onClick={() => setShowStatusMenu((v) => !v)}>
          <div
            className="avatar sm"
            style={{ background: user?.avatar_color || '#1a44c9' }}
          >
            {user?.avatar_initials || '?'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--text-highlight)', fontSize: 12 }}>
              {user?.display_name}
            </span>
            <span className="text-small text-secondary">
              <span className={`status-dot ${user?.status || 'online'}`} /> {labelStatus(user?.status)}
            </span>
          </div>
          <span className="level-badge">LVL {user?.level || 1}</span>
          {showStatusMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                minWidth: 180,
                zIndex: 1000,
              }}
              onMouseLeave={() => setShowStatusMenu(false)}
            >
              {[
                { v: 'online', l: 'Онлайн' },
                { v: 'in-game', l: 'В игре' },
                { v: 'offline', l: 'Оффлайн' },
              ].map((s) => (
                <div
                  key={s.v}
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                  className="search-result"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await setStatus(s.v);
                    setShowStatusMenu(false);
                  }}
                >
                  <span className={`status-dot ${s.v}`} style={{ marginRight: 8 }} />
                  {s.l}
                </div>
              ))}
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderTop: '1px solid var(--border-subtle)',
                }}
                className="search-result"
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowStatusMenu(false);
                  await useAppStore.getState().logout();
                }}
              >
                Выйти
              </div>
            </div>
          )}
        </div>

        <div className="window-buttons">
          <button className="window-btn" onClick={() => window.electronAPI?.minimizeWindow()}>
            &#xE921;
          </button>
          <button className="window-btn" onClick={() => window.electronAPI?.maximizeWindow()}>
            &#xE922;
          </button>
          <button className="window-btn close" onClick={() => window.electronAPI?.closeWindow()}>
            &#xE8BB;
          </button>
        </div>
      </div>
    </div>
  );
}

function labelStatus(s) {
  return ({ online: 'Онлайн', 'in-game': 'В игре', offline: 'Оффлайн' })[s] || 'Онлайн';
}
