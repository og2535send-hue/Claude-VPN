import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function ProfileView() {
  const currentUser = useAppStore(s => s.currentUser);
  const userGames = useAppStore(s => s.userGames);
  const friends = useAppStore(s => s.friends);
  const userAchievements = useAppStore(s => s.userAchievements);
  const openModal = useAppStore(s => s.openModal);
  const activity = useAppStore(s => s.activity);
  const allGames = useAppStore(s => s.allGames);

  const totalHours = userGames.reduce((s, g) => s + (g.hours_played || 0), 0);
  const recent = [...userGames].filter(g => g.last_played).sort((a, b) => (b.last_played || '').localeCompare(a.last_played || '')).slice(0, 3);
  const rarestAchievements = userAchievements
    .filter(a => a.rarity === 'legendary' || a.rarity === 'epic')
    .slice(0, 3);
  const yearsOnSteam = currentUser.created_at ? Math.max(1, Math.floor((Date.now() - new Date(currentUser.created_at).getTime()) / (365 * 86400 * 1000))) : 0;
  const showcaseGame = currentUser.showcase_game_id ? allGames.find(g => g.id === currentUser.showcase_game_id) : null;

  return (
    <div>
      <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${currentUser.profile_background || '#1b2838'}, #0a1320)` }}>
        <div className="profile-header">
          <div className="avatar xl" style={{ background: currentUser.avatar_color }}>{currentUser.avatar_initials}</div>
          <div>
            <div className="profile-info-name">{currentUser.display_name}</div>
            <div className="profile-info-meta">@{currentUser.username} • Уровень {currentUser.level || 1} • В Steam {yearsOnSteam} лет</div>
            {currentUser.bio && <div style={{ marginTop: 8, opacity: 0.85, maxWidth: 600 }}>{currentUser.bio}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="stat-card-value">{userGames.length}</div>
          <div className="stat-card-label">Игр в библиотеке</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalHours.toFixed(1)}</div>
          <div className="stat-card-label">Часов сыграно</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{userAchievements.length}</div>
          <div className="stat-card-label">Достижений</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{friends.filter(f => f.status === 'accepted').length}</div>
          <div className="stat-card-label">Друзей</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className="btn primary" onClick={() => openModal('editProfile')}>Редактировать профиль</button>
      </div>

      {showcaseGame && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">🎖 Витрина</h3>
          <div className="card" style={{ background: `linear-gradient(135deg, ${showcaseGame.cover_color}, ${showcaseGame.cover_color2})`, color: 'white', padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>{showcaseGame.title}</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>{showcaseGame.genre}</div>
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">Недавние игры</h3>
          <div className="grid grid-3">
            {recent.map(g => (
              <div key={g.id} className="card flex gap-3">
                <div style={{ width: 80, height: 60, borderRadius: 2, background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}></div>
                <div className="flex-1">
                  <div className="text-highlight" style={{ fontWeight: 600 }}>{g.title}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>{g.hours_played.toFixed(1)} ч</div>
                  <div className="text-secondary" style={{ fontSize: 11 }}>{g.last_played && new Date(g.last_played).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rarestAchievements.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">🏆 Витрина достижений</h3>
          <div className="grid grid-3">
            {rarestAchievements.map(a => (
              <div key={a.achievement_id} className="achievement-item unlocked">
                <div className="achievement-icon">{a.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{a.name}</div>
                  <span className={`rarity-${a.rarity}`} style={{ fontSize: 11 }}>{a.rarity.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-highlight mb-2">📜 Активность</h3>
        {activity.length === 0 && <div className="text-secondary">Нет активности</div>}
        {activity.map(a => {
          let data = {};
          try { data = JSON.parse(a.data || '{}'); } catch (e) {}
          const game = allGames.find(g => g.id === data.gameId);
          let text = '';
          if (a.type === 'game_launch') text = `Запустил «${game?.title || data.gameId}»`;
          else if (a.type === 'achievement') text = `Получил достижение «${data.name}»`;
          else if (a.type === 'purchase') text = `Приобрёл «${game?.title || data.gameId}»`;
          else if (a.type === 'friend_add') text = `Добавил в друзья`;
          return (
            <div key={a.id} className="flex gap-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border_subtle)' }}>
              <div className="text-secondary" style={{ fontSize: 12, minWidth: 100 }}>{new Date(a.created_at).toLocaleString('ru-RU')}</div>
              <div>{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
