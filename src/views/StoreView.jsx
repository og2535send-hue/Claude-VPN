import React, { useState, useEffect, useMemo } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

const GENRES = ['all', 'Survival', 'Action', 'Puzzle', 'Sandbox', 'Shooter'];
const PRICE_OPTIONS = [
  { v: 'all', l: 'Все' },
  { v: '0', l: 'Бесплатно' },
  { v: '500', l: 'До 500₽' },
  { v: '1000', l: 'До 1000₽' },
  { v: '2000', l: 'До 2000₽' },
];

export default function StoreView() {
  const allGames = useAppStore((s) => s.allGames);
  const userGames = useAppStore((s) => s.userGames);
  const openModal = useAppStore((s) => s.openModal);
  const addToCart = useAppStore((s) => s.addToCart);
  const isCartOpen = useAppStore((s) => s.isCartOpen);

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [bannerIdx, setBannerIdx] = useState(0);

  const ownedIds = useMemo(() => new Set(userGames.map((g) => g.game_id)), [userGames]);

  const promoGames = useMemo(
    () => allGames.filter((g) => g.discount > 0).slice(0, 3),
    [allGames]
  );

  useEffect(() => {
    if (promoGames.length <= 1) return;
    const id = setInterval(() => setBannerIdx((b) => (b + 1) % promoGames.length), 5000);
    return () => clearInterval(id);
  }, [promoGames.length]);

  const filtered = useMemo(() => {
    let list = [...allGames];
    if (search) list = list.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));
    if (genre !== 'all') list = list.filter((g) => g.genre === genre);
    if (priceFilter !== 'all') {
      if (priceFilter === '0') list = list.filter((g) => g.price === 0);
      else {
        const max = parseFloat(priceFilter);
        list = list.filter((g) => (g.price * (100 - g.discount) / 100) <= max);
      }
    }
    if (tagFilter === 'multiplayer') list = list.filter((g) => g.is_multiplayer);
    if (tagFilter === 'coop') list = list.filter((g) => g.is_coop);
    if (tagFilter === 'single') list = list.filter((g) => !g.is_multiplayer);

    if (sortBy === 'popular') list.sort((a, b) => b.reviews_count - a.reviews_count);
    else if (sortBy === 'new') list.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    else if (sortBy === 'price_asc') list.sort((a, b) => (a.price * (100 - a.discount) / 100) - (b.price * (100 - b.discount) / 100));
    else if (sortBy === 'price_desc') list.sort((a, b) => (b.price * (100 - b.discount) / 100) - (a.price * (100 - a.discount) / 100));
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [allGames, search, genre, priceFilter, tagFilter, sortBy]);

  return (
    <div className="view-container">
      <h1 className="view-title">Магазин</h1>

      {promoGames.length > 0 && (
        <div className="carousel mb-2">
          {promoGames.map((g, i) => (
            <div
              key={g.id}
              className="carousel-slide"
              style={{
                background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                opacity: i === bannerIdx ? 1 : 0,
                pointerEvents: i === bannerIdx ? 'auto' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => openModal({ type: 'game-store', data: g })}
            >
              <span className="discount-label" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
                -{g.discount}%
              </span>
              <div style={{ fontSize: 32, fontWeight: 'bold' }}>{g.title}</div>
              <div style={{ opacity: 0.8 }}>{g.genre}</div>
            </div>
          ))}
          {promoGames.length > 1 && (
            <div className="carousel-dots">
              {promoGames.map((_, i) => (
                <div
                  key={i}
                  className={`carousel-dot ${i === bannerIdx ? 'active' : ''}`}
                  onClick={() => setBannerIdx(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="row mb-2" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="Поиск игр..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          {GENRES.map((g) => <option key={g} value={g}>{g === 'all' ? 'Все жанры' : g}</option>)}
        </select>
        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
          {PRICE_OPTIONS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="all">Все режимы</option>
          <option value="multiplayer">Мультиплеер</option>
          <option value="coop">Кооп</option>
          <option value="single">Сингл</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="popular">Популярные</option>
          <option value="new">Новинки</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="rating">Рейтинг</option>
        </select>
      </div>

      <div className="grid grid-4" style={{ marginRight: isCartOpen ? 320 : 0 }}>
        {filtered.map((g) => {
          const owned = ownedIds.has(g.id);
          const finalPrice = g.price * (100 - g.discount) / 100;
          return (
            <div
              key={g.id}
              className="game-card"
              onClick={() => openModal({ type: 'game-store', data: g })}
            >
              <div
                className="game-cover"
                style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}
              >
                {g.title}
              </div>
              <div className="p-1">
                <div className="text-small text-secondary">{g.developer}</div>
                <div className="row mb-1">
                  <FaStar className="rating" /> <span className="text-small">{g.rating?.toFixed(1)}</span>
                  <div className="spacer" />
                  {owned && <span className="text-accent text-small">В библиотеке</span>}
                </div>
                <div className="row">
                  {g.discount > 0 && (
                    <>
                      <span className="discount-label">-{g.discount}%</span>
                      <span className="price-old text-small">{g.price.toLocaleString('ru-RU')}₽</span>
                    </>
                  )}
                  <span className="price-new">
                    {finalPrice === 0 ? 'Бесплатно' : `${finalPrice.toLocaleString('ru-RU')}₽`}
                  </span>
                  <div className="spacer" />
                  {!owned && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({ ...g, finalPrice });
                      }}
                    >
                      В корзину
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isCartOpen && <CartPanel />}
    </div>
  );
}

function CartPanel() {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const toggleCart = useAppStore((s) => s.toggleCart);
  const currentUser = useAppStore((s) => s.currentUser);
  const refreshUserGames = useAppStore((s) => s.refreshUserGames);
  const refreshDownloads = useAppStore((s) => s.refreshDownloads);
  const showToast = useAppStore((s) => s.showToast);

  const total = cart.reduce((s, g) => s + (g.finalPrice || 0), 0);

  const checkout = async () => {
    for (const g of cart) {
      await window.electronAPI.purchaseGame(currentUser.id, g.id);
    }
    showToast(`Куплено игр: ${cart.length}`);
    clearCart();
    toggleCart();
    await refreshUserGames();
    await refreshDownloads();
  };

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <strong style={{ color: 'var(--text-highlight)' }}>Корзина</strong>
        <FaTimes style={{ cursor: 'pointer' }} onClick={toggleCart} />
      </div>
      <div className="cart-items">
        {cart.length === 0 && <div className="empty-state">Корзина пуста</div>}
        {cart.map((g) => (
          <div key={g.id} className="cart-item">
            <div
              style={{
                width: 60, height: 30,
                background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
                borderRadius: 2, flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--text-highlight)', fontSize: 12 }}>{g.title}</div>
              <div className="text-small text-accent">
                {(g.finalPrice || 0).toLocaleString('ru-RU')}₽
              </div>
            </div>
            <FaTimes style={{ cursor: 'pointer' }} onClick={() => removeFromCart(g.id)} />
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <div className="row mb-1">
          <strong>Итого:</strong>
          <div className="spacer" />
          <strong style={{ color: 'var(--text-highlight)' }}>
            {total.toLocaleString('ru-RU')}₽
          </strong>
        </div>
        <button
          className="btn btn-green"
          style={{ width: '100%' }}
          disabled={cart.length === 0}
          onClick={checkout}
        >
          Оформить покупку
        </button>
      </div>
    </div>
  );
}
