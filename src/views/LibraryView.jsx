import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import GameDetailView from './GameDetailView';

export default function LibraryView() {
  const userGames = useAppStore((s) => s.userGames);
  const selectedGame = useAppStore((s) => s.selectedGame);
  const setSelectedGame = useAppStore((s) => s.setSelectedGame);
  const refreshUserGames = useAppStore((s) => s.refreshUserGames);
  const currentUser = useAppStore((s) => s.currentUser);
  const showToast = useAppStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('alpha');
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (!selectedGame && userGames.length > 0) {
      setSelectedGame(userGames[0]);
    }
  }, [userGames, selectedGame]);

  const filteredGames = useMemo(() => {
    let list = userGames.filter((g) => !g.is_hidden);
    if (search) {
      list = list.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (filter === 'favorites') list = list.filter((g) => g.is_favorite);
    if (filter === 'recent') list = list.filter((g) => g.last_played);
    if (filter === 'multiplayer') list = list.filter((g) => g.is_multiplayer);
    if (filter === 'coop') list = list.filter((g) => g.is_coop);
    if (filter === 'survival') list = list.filter((g) => g.genre === 'Survival');

    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'hours') list = [...list].sort((a, b) => b.hours_played - a.hours_played);
    else if (sortBy === 'recent') list = [...list].sort((a, b) => (b.added_at || '').localeCompare(a.added_at || ''));
    return list;
  }, [userGames, search, filter, sortBy]);

  const onContextMenu = (e, game) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, game });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const toggleFav = async (g) => {
    await window.electronAPI.toggleFavorite(currentUser.id, g.game_id);
    await refreshUserGames();
  };

  const toggleHidden = async (g) => {
    await window.electronAPI.toggleHidden(currentUser.id, g.game_id);
    await refreshUserGames();
    if (selectedGame?.game_id === g.game_id) setSelectedGame(null);
  };

  const removeGame = async (g) => {
    await window.electronAPI.removeGameFromLibrary(currentUser.id, g.game_id);
    showToast('Игра удалена из библиотеки');
    setSelectedGame(null);
    await refreshUserGames();
  };

  return (
    <div className="library-layout">
      <div className="library-sidebar">
        <div className="p-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '100%', marginBottom: 4 }}
          >
            <option value="all">Все</option>
            <option value="favorites">Избранное</option>
            <option value="recent">Недавние</option>
            <option value="multiplayer">Мультиплеер</option>
            <option value="coop">Кооп</option>
            <option value="survival">Выживание</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="alpha">По алфавиту</option>
            <option value="hours">По времени</option>
            <option value="recent">Недавно добавленные</option>
          </select>
        </div>

        <div className="library-list">
          {filteredGames.length === 0 && (
            <div className="empty-state">Нет игр</div>
          )}
          {filteredGames.map((g) => (
            <div
              key={g.id}
              className={`library-item ${selectedGame?.id === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGame(g)}
              onContextMenu={(e) => onContextMenu(e, g)}
            >
              <div
                className="library-item-cover"
                style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="library-item-title" style={{
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  color: g.is_favorite ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {g.is_favorite ? '★ ' : ''}{g.title}
                </div>
                <div className="library-item-hours">
                  {(g.hours_played || 0).toFixed(1)} ч.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="library-detail">
        {selectedGame ? (
          <GameDetailView game={selectedGame} />
        ) : (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            Выберите игру из списка
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            zIndex: 9999,
            minWidth: 180,
          }}
        >
          {[
            { label: 'Играть', onClick: async () => {
              await window.electronAPI.launchGame(currentUser.id, contextMenu.game.game_id);
              await refreshUserGames();
            }},
            { label: contextMenu.game.is_favorite ? 'Убрать из избранного' : 'В избранное',
              onClick: () => toggleFav(contextMenu.game) },
            { label: 'Скрыть', onClick: () => toggleHidden(contextMenu.game) },
            { label: 'Удалить из библиотеки', onClick: () => removeGame(contextMenu.game) },
            { label: 'Свойства', onClick: () => setSelectedGame(contextMenu.game) },
          ].map((item, i) => (
            <div
              key={i}
              className="search-result"
              style={{ padding: '8px 12px' }}
              onClick={item.onClick}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
