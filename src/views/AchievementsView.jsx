import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { RARITY_COLORS } from '../styles/theme';

export default function AchievementsView() {
  const user = useAppStore((s) => s.currentUser);
  const allGames = useAppStore((s) => s.allGames);
  const userGames = useAppStore((s) => s.userGames);
  const userAchievements = useAppStore((s) => s.userAchievements);

  const [expanded, setExpanded] = useState({});
  const [achievementsByGame, setAchievementsByGame] = useState({});

  useEffect(() => {
    (async () => {
      const map = {};
      for (const ug of userGames) {
        const all = await window.electronAPI.getAchievements(ug.game_id);
        map[ug.game_id] = all;
      }
      setAchievementsByGame(map);
    })();
  }, [userGames.length]);

  const totalAll = Object.values(achievementsByGame).reduce((s, a) => s + a.length, 0);
  const totalUnlocked = userAchievements.length;
  const progressPct = totalAll > 0 ? (totalUnlocked / totalAll * 100) : 0;

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpToNext = (level * 100) - xp;

  const rareAch = [...userAchievements]
    .sort((a, b) => {
      const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
      return (order[a.rarity] || 9) - (order[b.rarity] || 9);
    })
    .slice(0, 5);

  return (
    <div className="view-container">
      <h1 className="view-title">Достижения</h1>

      <section className="mb-2 grid grid-2">
        <div className="game-card p-2 row" style={{ gap: 20 }}>
          <ProgressRing pct={progressPct} />
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Прогресс достижений</div>
            <div style={{ color: 'var(--text-highlight)', fontSize: 24, fontWeight: 'bold' }}>
              {totalUnlocked} / {totalAll}
            </div>
            <div className="text-small text-secondary">{progressPct.toFixed(1)}% завершено</div>
          </div>
        </div>

        <div className="game-card p-2">
          <div className="text-secondary text-small mb-1">УРОВЕНЬ</div>
          <div style={{ fontSize: 28, color: 'var(--text-highlight)', fontWeight: 'bold' }}>
            {level}
          </div>
          <div className="text-small text-secondary mb-1">
            {xp} XP {xpToNext > 0 ? `(до следующего: ${xpToNext})` : ''}
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.max(0, Math.min(100, (xp % 100)))}%` }}
            />
          </div>
        </div>
      </section>

      {rareAch.length > 0 && (
        <section className="mb-2">
          <h3 className="section-title">Самые редкие</h3>
          <div className="grid grid-4">
            {rareAch.map((a) => (
              <div
                key={a.achievement_id}
                className="game-card p-2 text-center"
                style={{ borderTop: `3px solid ${RARITY_COLORS[a.rarity]}` }}
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
        <h3 className="section-title">По играм</h3>
        {userGames.map((ug) => {
          const all = achievementsByGame[ug.game_id] || [];
          const unlockedIds = new Set(
            userAchievements
              .filter((a) => a.game_id === ug.game_id)
              .map((a) => a.achievement_id)
          );
          const u = unlockedIds.size;
          const t = all.length;
          const open = !!expanded[ug.game_id];
          return (
            <div key={ug.id} className="mb-1" style={{ background: 'var(--bg-panel)', borderRadius: 4 }}>
              <div
                className="row p-2"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded((s) => ({ ...s, [ug.game_id]: !s[ug.game_id] }))}
              >
                <div
                  style={{
                    width: 48, height: 32,
                    background: `linear-gradient(135deg, ${ug.cover_color}, ${ug.cover_color2})`,
                    borderRadius: 2,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{ug.title}</div>
                  <div className="text-small text-secondary">{u} / {t} достижений</div>
                </div>
                <div style={{ minWidth: 120 }}>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${t ? u / t * 100 : 0}%` }} />
                  </div>
                </div>
                <span>{open ? '▾' : '▸'}</span>
              </div>
              {open && (
                <div style={{ padding: '0 8px 8px' }}>
                  {all.map((a) => {
                    const unlocked = unlockedIds.has(a.id);
                    return (
                      <div key={a.id} className={`achievement-row ${unlocked ? '' : 'achievement-locked'}`}>
                        <div
                          className="achievement-icon"
                          style={{ background: RARITY_COLORS[a.rarity] + '40' }}
                        >
                          {a.icon || '🏆'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--text-highlight)' }}>{a.name}</div>
                          <div className="text-small text-secondary">{a.description}</div>
                        </div>
                        <span className="tag" style={{ color: RARITY_COLORS[a.rarity] }}>
                          {a.rarity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {userGames.length === 0 && <div className="empty-state">У вас пока нет игр</div>}
      </section>
    </div>
  );
}

function ProgressRing({ pct }) {
  const size = 100;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100 * circ);
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bg-tertiary)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        fill="var(--text-highlight)"
        fontSize="18"
        fontWeight="bold"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
