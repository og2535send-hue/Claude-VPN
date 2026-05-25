import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaPlay } from 'react-icons/fa';

export default function HomeView() {
  const currentUser = useAppStore(s => s.currentUser);
  const userGames = useAppStore(s => s.userGames);
  const allGames = useAppStore(s => s.allGames);
  const friends = useAppStore(s => s.friends);
  const setActiveView = useAppStore(s => s.setActiveView);
  const setSelectedGame = useAppStore(s => s.setSelectedGame);
  const openModal = useAppStore(s => s.openModal);
  const refreshGames = useAppStore(s => s.refreshGames);

  const favorites = userGames.filter(g => g.is_favorite);
  const recent = [...userGames].filter(g => g.last_played).sort((a, b) => (b.last_played || '').localeCompare(a.last_played || '')).slice(0, 5);
  const ownedIds = new Set(userGames.map(g => g.game_id));
  const recommendations = allGames.filter(g => !ownedIds.has(g.id)).slice(0, 4);
  const onlineFriends = friends.filter(f => f.status === 'accepted').slice(0, 6);

  const [carouselIdx, setCarouselIdx] = useState(0);
  useEffect(() => {
    if (favorites.length <= 1) return;
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % Math.min(favorites.length, 3)), 5000);
    return () => clearInterval(t);
  }, [favorites.length]);

  const playGame = async (g) => {
    await window.electronAPI.launchGame(currentUser.id, g.game_id || g.id);
    await refreshGames();
    alert(`Запуск ${g.title}...`);
  };

  const hour = new Date().getHours();
  let greet = 'Добрый день';
  if (hour < 6) greet = 'Доброй ночи';
  else if (hour < 12) greet = 'Доброе утро';
  else if (hour >= 18) greet = 'Добрый вечер';

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{greet}, {currentUser.display_name}!</div>
        <div className="page-subtitle">Что бы вы хотели сыграть сегодня?</div>
      </div>

      {favorites.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">⭐ Избранное</h3>
          <div style={{ position: 'relative', height: 260, borderRadius: 6, overflow: 'hidden' }}>
            {favorites.slice(0, 3).map((g, i) => (
              <div
                key={g.id}
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                  padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  opacity: i === carouselIdx ? 1 : 0,
                  transition: 'opacity 0.5s'
                }}
              >
                <div style={{ fontSize: 32, color: 'white', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{g.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>{g.hours_played.toFixed(1)} ч • {g.genre}</div>
                <button className="btn green" style={{ width: 200 }} onClick={() => playGame(g)}><FaPlay /> ИГРАТЬ</button>
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6 }}>
              {favorites.slice(0, 3).map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: 50,
                  background: i === carouselIdx ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer'
                }} onClick={() => setCarouselIdx(i)}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">🕐 Недавно играли</h3>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
            {recent.map(g => (
              <div key={g.id} className="game-card" style={{ minWidth: 200 }} onClick={() => { setSelectedGame(g); setActiveView('library'); }}>
                <div className="game-card-cover" style={{ height: 100, background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}>
                  <div className="game-card-title" style={{ fontSize: 13 }}>{g.title}</div>
                </div>
                <div className="game-card-body">
                  <div style={{ fontSize: 11, color: 'var(--text_secondary)' }}>{g.hours_played.toFixed(1)} ч</div>
                  <button className="btn green sm" style={{ width: '100%', padding: '6px' }} onClick={(e) => { e.stopPropagation(); playGame(g); }}>Играть</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">💡 Рекомендации</h3>
          <div className="grid grid-4">
            {recommendations.map(g => {
              const price = Math.round(g.price * (100 - g.discount) / 100);
              return (
                <div key={g.id} className="game-card" onClick={() => openModal('gameDetail', g)}>
                  <div className="game-card-cover" style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}>
                    <div className="game-card-title">{g.title}</div>
                  </div>
                  <div className="game-card-body">
                    <div className="game-card-dev">{g.developer}</div>
                    <div className="stars">{'★'.repeat(Math.round(g.rating))}<span className="text-secondary"> {g.rating}</span></div>
                    <div className="game-card-price">
                      {g.discount > 0 && <span className="discount-badge">-{g.discount}%</span>}
                      {g.discount > 0 && <span className="price-old">{g.price.toLocaleString('ru-RU')} ₽</span>}
                      <span className="price-new">{price.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-highlight mb-2">👥 Друзья онлайн</h3>
        {onlineFriends.length === 0 ? (
          <div className="text-secondary">Никого онлайн. Добавьте друзей через раздел Друзья.</div>
        ) : (
          <div className="grid grid-3">
            {onlineFriends.map(f => (
              <div key={f.id} className="card flex gap-3" style={{ alignItems: 'center' }}>
                <div className="avatar md" style={{ background: f.avatar_color }}>{f.avatar_initials}</div>
                <div className="flex-1">
                  <div className="text-highlight">{f.display_name}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>В сети</div>
                </div>
                <button className="btn sm" onClick={() => { useAppStore.getState().setActiveFriend(f); useAppStore.getState().toggleFriendsPanel(); }}>💬</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
