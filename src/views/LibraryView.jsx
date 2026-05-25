import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import GameDetailView from './GameDetailView.jsx';

export default function LibraryView() {
  const userGames = useAppStore(s => s.userGames);
  const selectedGame = useAppStore(s => s.selectedGame);
  const setSelectedGame = useAppStore(s => s.setSelectedGame);
  const currentUser = useAppStore(s => s.currentUser);
  const refreshGames = useAppStore(s => s.refreshGames);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('alpha');
  const [contextMenu, setContextMenu] = useState(null);

  const games = useMemo(() => {
    let list = userGames.filter(g => !g.is_hidden || filter === 'all');
    if (search) list = list.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'favorite') list = list.filter(g => g.is_favorite);
    if (filter === 'recent') list = list.filter(g => g.last_played);
    if (filter === 'multiplayer') list = list.filter(g => g.is_multiplayer);
    if (filter === 'coop') list = list.filter(g => g.is_coop);
    if (filter === 'survival') list = list.filter(g => g.genre === 'Survival');
    if (sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'hours') list.sort((a, b) => b.hours_played - a.hours_played);
    if (sort === 'recent_added') list.sort((a, b) => (b.added_at || '').localeCompare(a.added_at || ''));
    return list;
  }, [userGames, search, filter, sort]);

  const handleContextMenu = (e, g) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, game: g });
  };

  React.useEffect(() => {
    const hide = () => setContextMenu(null);
    document.addEventListener('click', hide);
    return () => document.removeEventListener('click', hide);
  }, []);

  return (
    <div className="library-layout">
      <div className="library-list">
        <div className="library-list-header">
          <input className="input" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все игры</option>
            <option value="favorite">⭐ Избранное</option>
            <option value="recent">🕐 Недавние</option>
            <option value="multiplayer">Мультиплеер</option>
            <option value="coop">Кооператив</option>
            <option value="survival">Выживание</option>
          </select>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="alpha">По алфавиту</option>
            <option value="hours">По времени</option>
            <option value="recent_added">Недавно добавленные</option>
          </select>
        </div>
        <div className="library-list-items">
          {games.length === 0 && <div style={{ padding: 16 }} className="text-secondary">Игр не найдено</div>}
          {games.map(g => (
            <div
              key={g.id}
              className={`library-list-item ${selectedGame?.id === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGame(g)}
              onContextMenu={(e) => handleContextMenu(e, g)}
            >
              <div className="library-list-cover" style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}></div>
              <div className="library-list-info">
                <div className="library-list-title">{g.is_favorite ? '⭐ ' : ''}{g.title}</div>
                <div className="library-list-hours">{g.hours_played.toFixed(1)} ч сыграно</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="library-detail">
        {selectedGame ? (
          <GameDetailView game={selectedGame} />
        ) : (
          <div style={{ padding: 40, textAlign: 'center' }} className="text-secondary">
            Выберите игру из списка слева
          </div>
        )}
      </div>
      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button className="context-menu-item" onClick={async () => { await window.electronAPI.launchGame(currentUser.id, contextMenu.game.game_id); await refreshGames(); }}>▶ Играть</button>
          <button className="context-menu-item" onClick={() => toggleFavorite(contextMenu.game.game_id)}>{contextMenu.game.is_favorite ? '☆ Убрать из избранного' : '⭐ В избранное'}</button>
          <button className="context-menu-item" onClick={async () => { await window.electronAPI.toggleHidden(currentUser.id, contextMenu.game.game_id); await refreshGames(); }}>👁 Скрыть</button>
          <button className="context-menu-item danger" onClick={async () => { await window.electronAPI.removeGameFromLibrary(currentUser.id, contextMenu.game.game_id); await refreshGames(); }}>🗑 Удалить из библиотеки</button>
        </div>
      )}
    </div>
  );
}
