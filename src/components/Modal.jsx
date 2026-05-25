import React, { useState, useEffect } from 'react';
import { FaTimes, FaStar } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';
import { AVATAR_COLORS, PROFILE_BG_COLORS } from '../styles/theme';

export default function Modal() {
  const modal = useAppStore((s) => s.activeModal);
  const closeModal = useAppStore((s) => s.closeModal);

  if (!modal) return null;

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <ModalContent type={modal.type} data={modal.data} />
      </div>
    </div>
  );
}

function ModalContent({ type, data }) {
  if (type === 'game-store') return <GameStoreModal game={data} />;
  if (type === 'profile-edit') return <ProfileEditModal />;
  if (type === 'change-password') return <ChangePasswordModal />;
  if (type === 'delete-account') return <DeleteAccountModal />;
  if (type === 'confirm') return <ConfirmModal data={data} />;
  return <DefaultModal data={data} />;
}

function DefaultModal({ data }) {
  const closeModal = useAppStore((s) => s.closeModal);
  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{data?.title || 'Уведомление'}</div>
        <FaTimes className="modal-close" onClick={closeModal} />
      </div>
      <div className="modal-body">{data?.message}</div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={closeModal}>OK</button>
      </div>
    </>
  );
}

function ConfirmModal({ data }) {
  const closeModal = useAppStore((s) => s.closeModal);
  return (
    <>
      <div className="modal-header">
        <div className="modal-title">{data?.title || 'Подтвердите'}</div>
        <FaTimes className="modal-close" onClick={closeModal} />
      </div>
      <div className="modal-body">{data?.message}</div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeModal}>Отмена</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            data?.onConfirm?.();
            closeModal();
          }}
        >
          {data?.confirmLabel || 'Подтвердить'}
        </button>
      </div>
    </>
  );
}

function GameStoreModal({ game }) {
  const closeModal = useAppStore((s) => s.closeModal);
  const addToCart = useAppStore((s) => s.addToCart);
  const userGames = useAppStore((s) => s.userGames);
  const owned = userGames.some((u) => u.game_id === game.id);
  const finalPrice = game.price * (100 - game.discount) / 100;
  const tags = parseTags(game.tags);

  return (
    <>
      <div
        style={{
          height: 180,
          background: `linear-gradient(135deg, ${game.cover_color}, ${game.cover_color2})`,
          display: 'flex',
          alignItems: 'flex-end',
          padding: 20,
          color: 'white',
        }}
      >
        <h2 style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{game.title}</h2>
      </div>
      <div className="modal-body">
        <div className="text-small text-secondary mb-1">{game.developer} • {game.release_date}</div>
        <div className="mb-2">
          <FaStar className="rating" /> {game.rating?.toFixed(1)} ({(game.reviews_count || 0).toLocaleString('ru-RU')} отзывов)
        </div>
        <div className="mb-2">{game.description}</div>
        <div className="mb-2">
          {tags.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        <h4 style={{ color: 'var(--text-highlight)', marginBottom: 8 }}>Системные требования</h4>
        <div className="text-small text-secondary mb-2">
          ОС: Windows 10 / 11 64-bit<br />
          Процессор: Intel Core i5-4460 или эквивалент AMD<br />
          ОЗУ: 8 GB<br />
          Видеокарта: GTX 1060 / RX 580 или новее<br />
          Свободное место: {game.size_gb} GB
        </div>
      </div>
      <div className="modal-footer">
        {owned ? (
          <span className="text-accent">В библиотеке</span>
        ) : (
          <>
            <div className="spacer">
              {game.discount > 0 ? (
                <>
                  <span className="discount-label">-{game.discount}%</span>{' '}
                  <span className="price-old">{game.price.toLocaleString('ru-RU')}₽</span>{' '}
                  <span className="price-new">{finalPrice.toLocaleString('ru-RU')}₽</span>
                </>
              ) : (
                <strong style={{ color: 'var(--text-highlight)' }}>
                  {game.price === 0 ? 'Бесплатно' : `${game.price.toLocaleString('ru-RU')}₽`}
                </strong>
              )}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                addToCart({ ...game, finalPrice });
                closeModal();
              }}
            >
              В корзину
            </button>
          </>
        )}
        <button className="btn btn-secondary" onClick={closeModal}>Закрыть</button>
      </div>
    </>
  );
}

function ProfileEditModal() {
  const user = useAppStore((s) => s.currentUser);
  const closeModal = useAppStore((s) => s.closeModal);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const userGames = useAppStore((s) => s.userGames);
  const showToast = useAppStore((s) => s.showToast);

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || AVATAR_COLORS[0]);
  const [avatarInitials, setAvatarInitials] = useState(user?.avatar_initials || '');
  const [profileBg, setProfileBg] = useState(user?.profile_background || PROFILE_BG_COLORS[0]);
  const [showcaseGameId, setShowcaseGameId] = useState(user?.showcase_game_id || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await window.electronAPI.updateProfile(user.id, {
        displayName, bio, avatarColor, avatarInitials: avatarInitials.slice(0, 2).toUpperCase(),
        profileBackground: profileBg, showcaseGameId: showcaseGameId || null,
      });
      await refreshProfile();
      showToast('Профиль обновлён');
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">Редактировать профиль</div>
        <FaTimes className="modal-close" onClick={closeModal} />
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Отображаемое имя</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Биография</label>
          <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Инициалы (2 символа)</label>
          <input
            value={avatarInitials}
            onChange={(e) => setAvatarInitials(e.target.value.slice(0, 2).toUpperCase())}
            maxLength={2}
          />
        </div>
        <div className="form-group">
          <label>Цвет аватара</label>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {AVATAR_COLORS.map((c) => (
              <div
                key={c}
                className={`color-swatch ${c === avatarColor ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setAvatarColor(c)}
              />
            ))}
            <input
              type="color"
              value={avatarColor}
              onChange={(e) => setAvatarColor(e.target.value)}
              style={{ width: 32, height: 32, padding: 0, border: 'none' }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Фон профиля</label>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {PROFILE_BG_COLORS.map((c) => (
              <div
                key={c}
                className={`color-swatch ${c === profileBg ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setProfileBg(c)}
              />
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Витрина (игра на профиле)</label>
          <select
            value={showcaseGameId}
            onChange={(e) => setShowcaseGameId(e.target.value)}
          >
            <option value="">Не выбрано</option>
            {userGames.map((g) => (
              <option key={g.game_id} value={g.game_id}>{g.title}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeModal}>Отмена</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}

function ChangePasswordModal() {
  const user = useAppStore((s) => s.currentUser);
  const closeModal = useAppStore((s) => s.closeModal);
  const showToast = useAppStore((s) => s.showToast);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setError('');
    if (newPwd.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    if (newPwd !== confirm) { setError('Пароли не совпадают'); return; }
    const res = await window.electronAPI.changePassword(user.id, oldPwd, newPwd);
    if (res.success) {
      showToast('Пароль изменён');
      closeModal();
    } else {
      setError(res.error || 'Ошибка');
    }
  };

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">Изменить пароль</div>
        <FaTimes className="modal-close" onClick={closeModal} />
      </div>
      <div className="modal-body">
        {error && <div className="auth-error">{error}</div>}
        <div className="form-group">
          <label>Старый пароль</label>
          <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Новый пароль</label>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Подтвердите новый пароль</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeModal}>Отмена</button>
        <button className="btn btn-primary" onClick={save}>Сохранить</button>
      </div>
    </>
  );
}

function DeleteAccountModal() {
  const user = useAppStore((s) => s.currentUser);
  const closeModal = useAppStore((s) => s.closeModal);
  const logout = useAppStore((s) => s.logout);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const del = async () => {
    setError('');
    const res = await window.electronAPI.deleteAccount(user.id, password);
    if (res.success) {
      closeModal();
      await logout();
    } else {
      setError(res.error || 'Ошибка');
    }
  };

  return (
    <>
      <div className="modal-header">
        <div className="modal-title">Удалить аккаунт</div>
        <FaTimes className="modal-close" onClick={closeModal} />
      </div>
      <div className="modal-body">
        <p style={{ marginBottom: 12 }}>
          Это действие удалит ВСЕ ваши данные (игры, друзей, сообщения).
          Введите пароль для подтверждения.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <div className="form-group">
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeModal}>Отмена</button>
        <button className="btn btn-danger" onClick={del}>Удалить</button>
      </div>
    </>
  );
}

function parseTags(t) {
  try {
    if (Array.isArray(t)) return t;
    return JSON.parse(t || '[]');
  } catch {
    return [];
  }
}
