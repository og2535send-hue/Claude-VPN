import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaShoppingCart } from 'react-icons/fa';

export default function StoreView() {
  const allGames = useAppStore(s => s.allGames);
  const userGames = useAppStore(s => s.userGames);
  const openModal = useAppStore(s => s.openModal);
  const addToCart = useAppStore(s => s.addToCart);
  const cart = useAppStore(s => s.cart);

  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [maxPrice, setMaxPrice] = useState('all');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState('popular');

  const ownedIds = useMemo(() => new Set(userGames.map(g => g.game_id)), [userGames]);

  const games = useMemo(() => {
    let list = [...allGames];
    if (search) list = list.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));
    if (genre !== 'all') list = list.filter(g => g.genre === genre);
    if (maxPrice === 'free') list = list.filter(g => g.price === 0);
    if (maxPrice === '500') list = list.filter(g => g.price <= 500);
    if (maxPrice === '1000') list = list.filter(g => g.price <= 1000);
    if (maxPrice === '2000') list = list.filter(g => g.price <= 2000);
    if (tag === 'multi') list = list.filter(g => g.is_multiplayer);
    if (tag === 'coop') list = list.filter(g => g.is_coop);
    if (tag === 'single') list = list.filter(g => !g.is_multiplayer);
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'new') list.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    return list;
  }, [allGames, search, genre, maxPrice, tag, sort]);

  const promos = useMemo(() => allGames.filter(g => g.discount > 0).slice(0, 3), [allGames]);
  const [promoIdx, setPromoIdx] = useState(0);
  useEffect(() => {
    if (promos.length <= 1) return;
    const t = setInterval(() => setPromoIdx(i => (i + 1) % promos.length), 5000);
    return () => clearInterval(t);
  }, [promos.length]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🏪 Магазин</div>
        <div className="page-subtitle">Найдите свою следующую любимую игру</div>
      </div>

      {promos.length > 0 && (
        <div style={{ position: 'relative', height: 240, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
          {promos.map((g, i) => (
            <div key={g.id} style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})`,
              padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              opacity: i === promoIdx ? 1 : 0, transition: 'opacity 0.5s', cursor: 'pointer'
            }} onClick={() => openModal('gameDetail', g)}>
              <div style={{ fontSize: 32, color: 'white', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{g.title}</div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <span className="discount-badge">-{g.discount}%</span>
                <span className="price-old">{g.price.toLocaleString('ru-RU')} ₽</span>
                <span className="price-new" style={{ fontSize: 18 }}>{Math.round(g.price * (100 - g.discount) / 100).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6 }}>
            {promos.map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 50, background: i === promoIdx ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => setPromoIdx(i)}></div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ width: 200 }} placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" style={{ width: 150 }} value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="all">Все жанры</option>
          <option value="Survival">Survival</option>
          <option value="Action">Action</option>
          <option value="Puzzle">Puzzle</option>
          <option value="Sandbox">Sandbox</option>
          <option value="Shooter">Shooter</option>
        </select>
        <select className="select" style={{ width: 140 }} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="all">Любая цена</option>
          <option value="free">Бесплатно</option>
          <option value="500">До 500 ₽</option>
          <option value="1000">До 1000 ₽</option>
          <option value="2000">До 2000 ₽</option>
        </select>
        <select className="select" style={{ width: 140 }} value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="all">Все теги</option>
          <option value="multi">Мультиплеер</option>
          <option value="coop">Кооп</option>
          <option value="single">Сингл</option>
        </select>
        <select className="select" style={{ width: 140 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="popular">Популярные</option>
          <option value="new">Новинки</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
          <option value="rating">Рейтинг</option>
        </select>
        {cart.length > 0 && (
          <button className="btn primary" onClick={() => openModal('cart')}>
            <FaShoppingCart /> Корзина ({cart.length})
          </button>
        )}
      </div>

      <div className="grid grid-4">
        {games.map(g => {
          const owned = ownedIds.has(g.id);
          const price = Math.round(g.price * (100 - g.discount) / 100);
          const inCart = cart.some(c => c.id === g.id);
          return (
            <div key={g.id} className="game-card" onClick={() => openModal('gameDetail', g)}>
              <div className="game-card-cover" style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}>
                <div className="game-card-title">{g.title}</div>
              </div>
              <div className="game-card-body">
                <div className="game-card-dev">{g.developer}</div>
                <div>
                  {(g.tags || []).slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                </div>
                <div className="stars">{'★'.repeat(Math.round(g.rating))}<span className="text-secondary" style={{ fontSize: 11 }}> {g.rating}</span></div>
                <div className="game-card-price">
                  {g.discount > 0 && <span className="discount-badge">-{g.discount}%</span>}
                  {g.discount > 0 && <span className="price-old">{g.price.toLocaleString('ru-RU')} ₽</span>}
                  <span className="price-new">{price.toLocaleString('ru-RU')} ₽</span>
                </div>
                {owned ? (
                  <span className="tag" style={{ background: 'var(--button_green)', color: '#beee11' }}>✓ В библиотеке</span>
                ) : (
                  <button className="btn primary sm" disabled={inCart} onClick={(e) => { e.stopPropagation(); addToCart(g); }}>
                    <FaShoppingCart /> {inCart ? 'В корзине' : 'В корзину'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
