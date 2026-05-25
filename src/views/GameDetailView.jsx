import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaPlay, FaStar, FaCog } from 'react-icons/fa';

export default function GameDetailView({ game }) {
  const currentUser = useAppStore(s => s.currentUser);
  const refreshGames = useAppStore(s => s.refreshGames);
  const refreshAchievements = useAppStore(s => s.refreshAchievements);
  const userAchievements = useAppStore(s => s.userAchievements);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);

  const [tab, setTab] = useState('overview');
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (!game) return;
    window.electronAPI.getAchievements(game.game_id).then(setAchievements).catch(() => {});
  }, [game?.game_id]);

  if (!game) return null;
  const unlockedIds = new Set(userAchievements.filter(a => a.game_id === game.game_id).map(a => a.achievement_id));
  const unlockedCount = unlockedIds.size;

  const playGame = async () => {
    await window.electronAPI.launchGame(currentUser.id, game.game_id);
    await window.electronAPI.updatePlaytime(currentUser.id, game.game_id, 0.5);
    await refreshGames();
    alert(`Запуск ${game.title}...`);
  };

  const unlockRandom = async () => {
    const locked = achievements.filter(a => !unlockedIds.has(a.id));
    if (locked.length === 0) { alert('Все достижения уже разблокированы!'); return; }
    const random = locked[Math.floor(Math.random() * locked.length)];
    const res = await window.electronAPI.unlockAchievement(currentUser.id, random.id);
    if (res.success) {
      await refreshAchievements();
      await refreshGames();
      alert(`🏆 Разблокировано: ${random.name} (+${res.xpGained} XP)`);
    }
  };

  return (
    <>
      <div className="library-banner" style={{ background: `linear-gradient(135deg, ${game.cover_color}, ${game.cover_color2})` }}>
        <div className="library-banner-title">{game.title}</div>
      </div>
      <div className="library-controls">
        <button className="btn green lg" onClick={playGame}><FaPlay /> ИГРАТЬ</button>
        <button className="btn" onClick={() => toggleFavorite(game.game_id)}>
          <FaStar color={game.is_favorite ? '#f5c518' : undefined} /> Избранное
        </button>
        <button className="btn"><FaCog /> Свойства</button>
      </div>
      <div className="library-stats">
        <div><strong>{game.hours_played.toFixed(1)} ч</strong>сыграно</div>
        <div><strong>{game.last_played ? new Date(game.last_played).toLocaleDateString('ru-RU') : '—'}</strong>последний запуск</div>
        <div><strong>{game.size_gb} ГБ</strong>размер</div>
        <div><strong>{unlockedCount} / {achievements.length}</strong>достижения</div>
      </div>
      <div className="library-tabs">
        {['overview', 'achievements', 'updates', 'dlc'].map(t => (
          <div key={t} className={`library-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Обзор' : t === 'achievements' ? 'Достижения' : t === 'updates' ? 'Обновления' : 'DLC'}
          </div>
        ))}
      </div>
      <div className="library-body">
        {tab === 'overview' && (
          <>
            <p style={{ marginBottom: 12, lineHeight: 1.5 }}>{game.description}</p>
            <div className="mb-3">
              {(game.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="text-secondary" style={{ fontSize: 13 }}>
              <div><strong className="text-highlight">Разработчик:</strong> {game.developer}</div>
              <div><strong className="text-highlight">Издатель:</strong> {game.publisher}</div>
              <div><strong className="text-highlight">Дата выхода:</strong> {game.release_date}</div>
              <div className="stars">{'★'.repeat(Math.round(game.rating))}<span className="text-secondary"> {game.rating}</span></div>
            </div>
          </>
        )}
        {tab === 'achievements' && (
          <>
            <div className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong className="text-highlight">{unlockedCount} из {achievements.length} ({achievements.length ? Math.round(unlockedCount / achievements.length * 100) : 0}%)</strong>
                <button className="btn primary sm" onClick={unlockRandom}>🎲 Разблокировать случайное</button>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${achievements.length ? unlockedCount / achievements.length * 100 : 0}%` }}></div>
              </div>
            </div>
            {achievements.map(a => {
              const unlocked = unlockedIds.has(a.id);
              return (
                <div key={a.id} className={`achievement-item ${unlocked ? 'unlocked' : ''}`} style={{ opacity: unlocked ? 1 : 0.5 }}>
                  <div className="achievement-icon">{a.icon}</div>
                  <div className="achievement-info">
                    <div className="achievement-name">{a.name}</div>
                    <div className="achievement-desc">{a.description}</div>
                    <span className={`rarity-${a.rarity}`} style={{ fontSize: 11 }}>{a.rarity.toUpperCase()} • +{a.xp_reward} XP</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {tab === 'updates' && (
          <div>
            {[
              { date: '12.03.2025', title: 'Обновление 2.4', notes: 'Исправлены критические баги. Улучшен баланс. Добавлены новые карты.' },
              { date: '20.02.2025', title: 'Хотфикс 2.3.1', notes: 'Закрыта серьёзная уязвимость. Оптимизация производительности.' },
              { date: '05.02.2025', title: 'Обновление 2.3', notes: 'Новый сюжетный контент. Перебалансировка вооружения.' }
            ].map((p, i) => (
              <div key={i} className="card mb-2">
                <div className="text-secondary" style={{ fontSize: 12 }}>{p.date}</div>
                <strong className="text-highlight">{p.title}</strong>
                <div style={{ marginTop: 6 }}>{p.notes}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'dlc' && (
          <div className="grid grid-2">
            {['Расширение «Тени прошлого»', 'Набор скинов «Зимний»', 'Сюжетное DLC «Возвращение»'].map((name, i) => (
              <div key={i} className="card">
                <strong className="text-highlight">{name}</strong>
                <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>Дополнительный контент</div>
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span className="price-new">{(299 + i * 200).toLocaleString('ru-RU')} ₽</span>
                  <button className="btn primary sm">Купить</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
