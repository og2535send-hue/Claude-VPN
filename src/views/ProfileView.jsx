import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { RARITY_COLORS } from '../styles/theme';

export default function ProfileView() {
  const user = useAppStore((s) => s.currentUser);
  const userGames = useAppStore((s) => s.userGames);
  const friends = useAppStore((s) => s.friends);
  const userAchievements = useAppStore((s) => s.userAchievements);
  const activity = useAppStore((s) => s.activity);
  const allGames = useAppStore((s) => s.allGames);
  const openModal = useAppStore((s) => s.openModal);

  const totalHours = userGames.reduce((s, g) => s + (g.hours_played || 0), 0);
  const yearsRegistered = user?.created_at
    ? Math.max(0, Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365 * 86400 * 1000)))
    : 0;

  const recent = [...userGames]
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played || '').localeCompare(a.last_played || ''))
    .slice(0, 3);

  const rareAchievements = [...userAchievements]
    .filter((a) => a.rarity === 'legendary' || a.rarity === 'epic')
    .slice(0, 3);

  const showcase = user?.showcase_game_id
    ? allGames.find((g) => g.id === user.showcase_game_id)
    : null;

  return (
    <div className="view-container">
      <div
        className="profile-banner mb-2"
        style={{
          background: user?.profile_background
            ? `linear-gradient(135deg, ${user.profile_background}, var(--bg-primary))`
            : 'var(--bg-secondary)',
        }}
      >
        <div className="row" style={{ width: '100%', alignItems: 'flex-end' }}>
          <div className="avatar lg" style={{ background: user?.avatar_color }}>
            {user?.avatar_initials || '?'}
          </div>
          <div style={{ marginLeft: 20 }}>
            <h2 style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              {user?.display_name}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>
              @{user?.username} • <span className="level-badge">LVL {user?.level || 1}</span>{' '}
              • {yearsRegistered} {yearsRegistered === 1 ? 'год' : 'лет'} в Steam
            </div>
            {user?.bio && (
              <div style={{ color: 'rgba(255,255,255,0.8)', marginTop: 6, maxWidth: 600 }}>
                {user.bio}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row mb-2">
        <button
          className="btn btn-primary"
          onClick={() => openModal({ type: 'profile-edit' })}
        >
          Редактировать профиль
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => openModal({ type: 'profile-edit' })}
        >
          Изменить аватар
        </button>
      </div>

      <div className="grid grid-4 mb-2">
        <div className="stat-card">
          <div className="stat-card-value">{userGames.length}</div>
          <div className="stat-card-label">Игр</div>
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
          <div className="stat-card-value">{friends.length}</div>
          <div className="stat-card-label">Друзей</div>
        </div>
      </div>

      {showcase && (
        <section className="mb-2">
          <h3 className="section-title">Витрина</h3>
          <div
            style={{
              height: 140,
              background: `linear-gradient(135deg, ${showcase.cover_color}, ${showcase.cover_color2})`,
              borderRadius: 4,
              padding: 20,
              display: 'flex',
              alignItems: 'flex-end',
              color: 'white',
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                {showcase.title}
              </div>
              <div style={{ opacity: 0.8 }}>{showcase.genre}</div>
            </div>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Недавние игры</h3>
          <div className="grid grid-3">
            {recent.map((g) => (
              <div key={g.id} className="game-card">
                <div
                  className="game-cover"
                  style={{ background: `linear-gradient(135deg, ${g.cover_color}, ${g.cover_color2})` }}
                >
                  {g.title}
                </div>
                <div className="p-1">
                  <div className="text-small text-secondary">
                    {(g.hours_played || 0).toFixed(1)} ч.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rareAchievements.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Витрина достижений</h3>
          <div className="row" style={{ gap: 12 }}>
            {rareAchievements.map((a) => (
              <div
                key={a.achievement_id}
                className="game-card p-1"
                style={{ flex: 1, textAlign: 'center' }}
              >
                <div
                  className="achievement-icon"
                  style={{
                    background: RARITY_COLORS[a.rarity] + '40',
                    margin: '0 auto 8px',
                  }}
                >
                  {a.icon || '🏆'}
                </div>
                <div style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>
                  {a.name}
                </div>
                <div className="text-small" style={{ color: RARITY_COLORS[a.rarity] }}>
                  {a.rarity}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="section-title">Активность</h3>
        {activity.length === 0 ? (
          <div className="empty-state">Активность не найдена</div>
        ) : (
          activity.map((a) => (
            <ActivityRow key={a.id} entry={a} allGames={allGames} />
          ))
        )}
      </section>
    </div>
  );
}

function ActivityRow({ entry, allGames }) {
  let data = {};
  try { data = JSON.parse(entry.data || '{}'); } catch {}
  const game = data.gameId ? allGames.find((g) => g.id === data.gameId) : null;
  const time = new Date(entry.created_at).toLocaleString('ru-RU');

  let text = '';
  if (entry.type === 'game_launch') text = `Запустил ${game?.title || 'игру'}`;
  else if (entry.type === 'achievement') text = `Получил достижение: ${data.name || ''}`;
  else if (entry.type === 'purchase') text = `Приобрёл ${game?.title || 'игру'}`;
  else if (entry.type === 'friend_add') text = `Добавил нового друга`;
  else text = entry.type;

  return (
    <div className="row" style={{
      padding: 10,
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1 }}>{text}</div>
      <div className="text-small text-secondary">{time}</div>
    </div>
  );
}
