import React, { useState, useEffect } from 'react';
import { FaPlay, FaStar, FaCog } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';
import { RARITY_COLORS } from '../styles/theme';

export default function GameDetailView({ game }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const userAchievements = useAppStore((s) => s.userAchievements);
  const refreshUserGames = useAppStore((s) => s.refreshUserGames);
  const refreshAchievements = useAppStore((s) => s.refreshAchievements);
  const showToast = useAppStore((s) => s.showToast);
  const [tab, setTab] = useState('overview');
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (!game?.game_id) return;
    window.electronAPI.getAchievements(game.game_id).then(setAchievements);
  }, [game?.game_id]);

  if (!game) return null;

  const tags = parseTags(game.tags);
  const unlockedIds = new Set(
    userAchievements.filter((a) => a.game_id === game.game_id).map((a) => a.achievement_id)
  );
  const unlockedCount = unlockedIds.size;
  const totalAchievements = achievements.length || game.achievements_total || 0;

  const playGame = async () => {
    await window.electronAPI.launchGame(currentUser.id, game.game_id);
    await window.electronAPI.updatePlaytime(currentUser.id, game.game_id, 0.5);
    await refreshUserGames();
    showToast(`Запуск ${game.title}...`);
  };

  const toggleFav = async () => {
    await window.electronAPI.toggleFavorite(currentUser.id, game.game_id);
    await refreshUserGames();
  };

  const unlockRandom = async () => {
    const locked = achievements.filter((a) => !unlockedIds.has(a.id));
    if (locked.length === 0) {
      showToast('Все достижения уже разблокированы!');
      return;
    }
    const pick = locked[Math.floor(Math.random() * locked.length)];
    const res = await window.electronAPI.unlockAchievement(currentUser.id, pick.id);
    if (res.success) {
      showToast(`🏆 ${pick.name} разблокировано! +${res.xpGained} XP`);
      await refreshAchievements();
      await refreshUserGames();
    }
  };

  return (
    <div>
      <div
        className="banner"
        style={{
          background: `linear-gradient(135deg, ${game.cover_color}, ${game.cover_color2})`,
        }}
      >
        <div className="banner-title">{game.title}</div>
      </div>

      <div className="p-2" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <button className="btn btn-green btn-large" style={{ minWidth: 200 }} onClick={playGame}>
          <FaPlay /> ИГРАТЬ
        </button>
        <button className="btn btn-secondary" onClick={toggleFav}>
          <FaStar style={{ color: game.is_favorite ? '#f1c40f' : undefined }} /> {' '}
          {game.is_favorite ? 'В избранном' : 'В избранное'}
        </button>
        <button className="btn btn-secondary">
          <FaCog /> Свойства
        </button>
        <div className="spacer" />
        <div className="col" style={{ gap: 4, alignItems: 'flex-end' }}>
          <div className="text-small text-secondary">
            <strong style={{ color: 'var(--text-highlight)' }}>{(game.hours_played || 0).toFixed(1)}</strong> часов сыграно
          </div>
          {game.last_played && (
            <div className="text-small text-secondary">
              Последний запуск: {new Date(game.last_played).toLocaleDateString('ru-RU')}
            </div>
          )}
          <div className="text-small text-secondary">
            Размер: {game.size_gb} GB
          </div>
        </div>
      </div>

      <div className="tabbar">
        {[
          ['overview', 'Обзор'],
          ['achievements', `Достижения (${unlockedCount}/${totalAchievements})`],
          ['updates', 'Обновления'],
          ['dlc', 'DLC'],
        ].map(([k, l]) => (
          <div
            key={k}
            className={`tab ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {l}
          </div>
        ))}
      </div>

      <div className="p-2">
        {tab === 'overview' && (
          <div>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>{game.description}</p>
            <div className="mb-2">
              {tags.map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="text-secondary text-small col" style={{ gap: 4 }}>
              <div>Разработчик: <span className="text-highlight">{game.developer}</span></div>
              <div>Издатель: <span className="text-highlight">{game.publisher}</span></div>
              <div>Дата выхода: <span className="text-highlight">{game.release_date}</span></div>
              <div>Рейтинг: <span className="text-highlight">{game.rating?.toFixed(1)} ★</span></div>
            </div>
          </div>
        )}

        {tab === 'achievements' && (
          <div>
            <div className="mb-2">
              <div className="row mb-1">
                <strong style={{ color: 'var(--text-highlight)' }}>
                  {unlockedCount} из {totalAchievements} достижений
                </strong>
                <div className="spacer" />
                <button className="btn btn-primary" onClick={unlockRandom}>
                  Разблокировать случайное
                </button>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${totalAchievements ? (unlockedCount / totalAchievements * 100) : 0}%` }}
                />
              </div>
            </div>

            {achievements.map((a) => {
              const unlocked = unlockedIds.has(a.id);
              return (
                <div key={a.id} className={`achievement-row ${unlocked ? '' : 'achievement-locked'}`}>
                  <div
                    className="achievement-icon"
                    style={{ background: RARITY_COLORS[a.rarity] + '30' }}
                  >
                    {a.icon || '🏆'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>
                      {a.name}
                    </div>
                    <div className="text-small text-secondary">{a.description}</div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
                    <span className="tag" style={{ color: RARITY_COLORS[a.rarity] }}>
                      {a.rarity}
                    </span>
                    <span className="text-small text-secondary">+{a.xp_reward} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'updates' && (
          <div>
            {[
              { date: '2026-04-15', title: 'Обновление 1.5.2', desc: 'Исправлены критические баги, добавлены новые предметы.' },
              { date: '2026-02-28', title: 'Обновление 1.5.0', desc: 'Большое обновление: новые карты, новые персонажи.' },
              { date: '2025-12-10', title: 'Зимнее событие', desc: 'Тематическое событие с эксклюзивными наградами.' },
            ].map((u, i) => (
              <div key={i} className="mb-2 p-2" style={{ background: 'var(--bg-panel)', borderRadius: 4 }}>
                <div className="row mb-1">
                  <strong style={{ color: 'var(--text-highlight)' }}>{u.title}</strong>
                  <div className="spacer" />
                  <span className="text-small text-secondary">{u.date}</span>
                </div>
                <div className="text-small">{u.desc}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'dlc' && (
          <div className="grid grid-2">
            {[
              { id: 'dlc1', title: 'Расширение: Новые горизонты', price: 599 },
              { id: 'dlc2', title: 'Сезонный пропуск', price: 999 },
              { id: 'dlc3', title: 'Косметический набор', price: 299 },
            ].map((dlc) => (
              <div key={dlc.id} className="game-card p-2">
                <strong style={{ color: 'var(--text-highlight)' }}>{dlc.title}</strong>
                <div className="text-small text-secondary mt-1">
                  Эксклюзивный контент для {game.title}
                </div>
                <div className="row mt-2">
                  <span className="price-new">{dlc.price.toLocaleString('ru-RU')}₽</span>
                  <div className="spacer" />
                  <button className="btn btn-primary">Купить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function parseTags(t) {
  try {
    if (Array.isArray(t)) return t;
    return JSON.parse(t || '[]');
  } catch { return []; }
}
