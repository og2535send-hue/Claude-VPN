import React, { useEffect, useState } from 'react';
import { FaPlay, FaStar, FaCommentDots } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function HomeView() {
  const user = useAppStore((s) => s.currentUser);
  const userGames = useAppStore((s) => s.userGames);
  const allGames = useAppStore((s) => s.allGames);
  const friends = useAppStore((s) => s.friends);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedGame = useAppStore((s) => s.setSelectedGame);
  const openModal = useAppStore((s) => s.openModal);
  const addToCart = useAppStore((s) => s.addToCart);
  const setActiveChatFriend = useAppStore((s) => s.setActiveChatFriend);
  const toggleFriendsPanel = useAppStore((s) => s.toggleFriendsPanel);
  const isFriendsPanelOpen = useAppStore((s) => s.isFriendsPanelOpen);

  const favorites = userGames.filter((g) => g.is_favorite);
  const recent = [...userGames]
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played || '').localeCompare(a.last_played || ''))
    .slice(0, 5);
  const ownedIds = new Set(userGames.map((g) => g.game_id));
  const recommendations = allGames.filter((g) => !ownedIds.has(g.id)).slice(0, 4);
  const friendsOnline = friends.filter((f) => f.status === 'online' || f.status === 'in-game').slice(0, 6);

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (favorites.length <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % favorites.length), 5000);
    return () => clearInterval(id);
  }, [favorites.length]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  })();

  const playGame = async (ug) => {
    await window.electronAPI.launchGame(user.id, ug.game_id);
    setActiveView('library');
    setSelectedGame(ug);
  };

  return (
    <div className="view-container">
      <h1 className="view-title">
        {greeting}, {user?.display_name}!
      </h1>

      {favorites.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Избранное</h3>
          <div className="carousel">
            {favorites.map((g, i) => (
              <div
                key={g.id}
                className="carousel-slide"
                style={{
                  background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                  opacity: i === slide ? 1 : 0,
                  pointerEvents: i === slide ? 'auto' : 'none',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                  {g.title}
                </div>
                <div style={{ opacity: 0.8, marginBottom: 14 }}>{g.genre}</div>
                <button className="btn btn-green btn-large" onClick={() => playGame(g)}>
                  <FaPlay /> Играть
                </button>
              </div>
            ))}
            {favorites.length > 1 && (
              <div className="carousel-dots">
                {favorites.map((_, i) => (
                  <div
                    key={i}
                    className={`carousel-dot ${i === slide ? 'active' : ''}`}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Недавно играли</h3>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {recent.map((g) => (
              <div key={g.id} className="game-card" style={{ width: 180 }}>
                <div
                  className="game-cover"
                  style={{
                    height: 100,
                    background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                  }}
                >
                  {g.title}
                </div>
                <div className="p-1">
                  <div className="text-small text-secondary">
                    {(g.hours_played || 0).toFixed(1)} ч.
                  </div>
                  <button
                    className="btn btn-green"
                    style={{ width: '100%', marginTop: 6, padding: '4px' }}
                    onClick={() => playGame(g)}
                  >
                    <FaPlay /> Играть
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Рекомендации</h3>
          <div className="grid grid-4">
            {recommendations.map((g) => {
              const finalPrice = g.price * (100 - g.discount) / 100;
              return (
                <div
                  key={g.id}
                  className="game-card"
                  onClick={() => openModal({ type: 'game-store', data: g })}
                >
                  <div
                    className="game-cover"
                    style={{
                      background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                    }}
                  >
                    {g.title}
                  </div>
                  <div className="p-1">
                    <div className="text-small text-secondary">{g.developer}</div>
                    <div className="row mb-1">
                      <FaStar className="rating" />
                      <span className="text-small">{g.rating?.toFixed(1)}</span>
                    </div>
                    <div className="row">
                      {g.discount > 0 && (
                        <span className="discount-label">-{g.discount}%</span>
                      )}
                      <span className="price-new">
                        {finalPrice === 0 ? 'Бесплатно' : `${finalPrice.toLocaleString('ru-RU')}₽`}
                      </span>
                      <div className="spacer" />
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({ ...g, finalPrice });
                        }}
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {friendsOnline.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Друзья онлайн</h3>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {friendsOnline.map((f) => (
              <div
                key={f.id}
                className="game-card p-1 row"
                style={{ minWidth: 220 }}
              >
                <div className="avatar sm" style={{ background: f.avatar_color }}>
                  {f.avatar_initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{f.display_name}</div>
                  <div className="text-small text-secondary">
                    <span className={`status-dot ${f.status}`} /> {f.status === 'in-game' ? 'В игре' : 'Онлайн'}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px' }}
                  onClick={() => {
                    setActiveChatFriend(f);
                    if (!isFriendsPanelOpen) toggleFriendsPanel();
                  }}
                >
                  <FaCommentDots />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
