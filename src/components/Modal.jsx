import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaTimes, FaStar } from 'react-icons/fa';

export default function Modal() {
  const activeModal = useAppStore(s => s.activeModal);
  const closeModal = useAppStore(s => s.closeModal);

  if (!activeModal) return null;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}><FaTimes /></button>
        {renderContent(activeModal)}
      </div>
    </div>
  );
}

function renderContent(m) {
  switch (m.type) {
    case 'cart': return <CartModal />;
    case 'gameDetail': return <GameDetailModal game={m.data} />;
    case 'editProfile': return <EditProfileModal />;
    case 'confirm': return <ConfirmModal data={m.data} />;
    default: return <div>Неизвестное окно</div>;
  }
}

function CartModal() {
  const cart = useAppStore(s => s.cart);
  const removeFromCart = useAppStore(s => s.removeFromCart);
  const clearCart = useAppStore(s => s.clearCart);
  const closeModal = useAppStore(s => s.closeModal);
  const currentUser = useAppStore(s => s.currentUser);
  const refreshGames = useAppStore(s => s.refreshGames);

  const total = cart.reduce((s, g) => s + Math.round(g.price * (100 - g.discount) / 100), 0);

  const checkout = async () => {
    for (const g of cart) {
      await window.electronAPI.purchaseGame(currentUser.id, g.id);
    }
    clearCart();
    await refreshGames();
    closeModal();
  };

  return (
    <>
      <div className="modal-title">🛒 Корзина</div>
      {cart.length === 0 ? (
        <div className="text-secondary">Корзина пуста</div>
      ) : (
        <>
          {cart.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderBottom: '1px solid var(--border_subtle)' }}>
              <div style={{ width: 60, height: 40, borderRadius: 2, background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}></div>
              <div className="flex-1">
                <div className="text-highlight">{g.title}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>{g.genre}</div>
              </div>
              <div className="price-new">{Math.round(g.price * (100 - g.discount) / 100).toLocaleString('ru-RU')} ₽</div>
              <button className="btn sm danger" onClick={() => removeFromCart(g.id)}>Убрать</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <strong className="text-highlight">Итого: {total.toLocaleString('ru-RU')} ₽</strong>
            <button className="btn green" onClick={checkout}>Оформить покупку</button>
          </div>
        </>
      )}
    </>
  );
}

function GameDetailModal({ game }) {
  const cart = useAppStore(s => s.cart);
  const addToCart = useAppStore(s => s.addToCart);
  const userGames = useAppStore(s => s.userGames);
  const inLibrary = userGames.some(ug => ug.game_id === game.id);
  const inCart = cart.some(c => c.id === game.id);
  const price = Math.round(game.price * (100 - game.discount) / 100);

  return (
    <>
      <div style={{ height: 160, borderRadius: 4, background: `linear-gradient(135deg, ${game.cover_color}, ${game.cover_color2})`, marginBottom: 16, padding: 20, display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 28, color: 'white', fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{game.title}</div>
      </div>
      <div className="text-secondary mb-2">{game.developer} • {game.publisher}</div>
      <div className="mb-3">
        {(game.tags || []).map(t => <span className="tag" key={t}>{t}</span>)}
      </div>
      <div className="mb-3">
        <span className="stars">{'★'.repeat(Math.round(game.rating))}{'☆'.repeat(5 - Math.round(game.rating))}</span>
        <span className="text-secondary" style={{ marginLeft: 8, fontSize: 12 }}>{game.rating} • {game.reviews_count?.toLocaleString('ru-RU')} отзывов</span>
      </div>
      <p style={{ marginBottom: 16, lineHeight: 1.5 }}>{game.description}</p>
      <div className="card mb-3">
        <strong className="text-highlight">Системные требования</strong>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text_secondary)' }}>
          <div>ОС: Windows 10 / 11 64-bit</div>
          <div>Процессор: Intel i5 или эквивалент</div>
          <div>Память: 8 ГБ ОЗУ</div>
          <div>Графика: GTX 1060 или эквивалент</div>
          <div>Место: {game.size_gb} ГБ</div>
        </div>
      </div>
      {inLibrary ? (
        <button className="btn green w-full" disabled>В библиотеке</button>
      ) : (
        <div className="flex gap-2">
          <button
            className="btn primary flex-1"
            disabled={inCart}
            onClick={() => addToCart(game)}
          >
            {inCart ? 'В корзине' : 'Добавить в корзину'}
          </button>
          <button className="btn green flex-1">Купить за {price.toLocaleString('ru-RU')} ₽</button>
        </div>
      )}
    </>
  );
}

function EditProfileModal() {
  const currentUser = useAppStore(s => s.currentUser);
  const setCurrentUser = useAppStore(s => s.setCurrentUser);
  const userGames = useAppStore(s => s.userGames);
  const closeModal = useAppStore(s => s.closeModal);
  const [displayName, setDisplayName] = useState(currentUser.display_name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatar_color || '#1a44c9');
  const [initials, setInitials] = useState(currentUser.avatar_initials || '');
  const [bg, setBg] = useState(currentUser.profile_background || '#1b2838');
  const [showcase, setShowcase] = useState(currentUser.showcase_game_id || '');

  const avatarColors = ['#1a44c9', '#c92d1a', '#1ac96d', '#c9a01a', '#a01ac9', '#1ac9c0', '#c91a85', '#ff7e5f'];
  const bgColors = ['#1b2838', '#2a1b38', '#1b3828', '#382a1b', '#1b1b38', '#381b2a'];

  const save = async () => {
    await window.electronAPI.updateProfile(currentUser.id, {
      displayName,
      bio,
      avatarColor,
      avatarInitials: (initials || displayName.slice(0, 2)).toUpperCase().slice(0, 2),
      profileBackground: bg,
      showcaseGameId: showcase || null
    });
    const u = await window.electronAPI.getProfile(currentUser.id);
    setCurrentUser(u);
    closeModal();
  };

  return (
    <>
      <div className="modal-title">Редактировать профиль</div>
      <div className="form-group">
        <label className="label">Отображаемое имя</label>
        <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label">Биография</label>
        <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label">Цвет аватара</label>
        <div className="color-swatches">
          {avatarColors.map(c => (
            <div key={c} className={`color-swatch ${avatarColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setAvatarColor(c)}></div>
          ))}
          <input type="color" value={avatarColor} onChange={(e) => setAvatarColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Инициалы (2 символа)</label>
        <input className="input" value={initials} maxLength={2} onChange={(e) => setInitials(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label">Цвет фона профиля</label>
        <div className="color-swatches">
          {bgColors.map(c => (
            <div key={c} className={`color-swatch ${bg === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setBg(c)}></div>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="label">Витрина (показываемая игра)</label>
        <select className="select" value={showcase} onChange={(e) => setShowcase(e.target.value)}>
          <option value="">— Не выбрано —</option>
          {userGames.map(g => <option key={g.game_id} value={g.game_id}>{g.title}</option>)}
        </select>
      </div>
      <button className="btn primary w-full" onClick={save}>Сохранить</button>
    </>
  );
}

function ConfirmModal({ data }) {
  const closeModal = useAppStore(s => s.closeModal);
  return (
    <>
      <div className="modal-title">{data?.title || 'Подтвердите действие'}</div>
      <p className="mb-3">{data?.message}</p>
      <div className="flex gap-2">
        <button className="btn flex-1" onClick={closeModal}>Отмена</button>
        <button className="btn danger flex-1" onClick={() => { data?.onConfirm && data.onConfirm(); closeModal(); }}>Подтвердить</button>
      </div>
    </>
  );
}
