import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function AchievementsView() {
  const currentUser = useAppStore(s => s.currentUser);
  const userGames = useAppStore(s => s.userGames);
  const userAchievements = useAppStore(s => s.userAchievements);
  const [allAch, setAllAch] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      const arr = [];
      for (const g of userGames) {
        const a = await window.electronAPI.getAchievements(g.game_id);
        arr.push({ game: g, achievements: a });
      }
      setAllAch(arr);
    })();
  }, [userGames.length]);

  const total = allAch.reduce((s, x) => s + x.achievements.length, 0);
  const unlocked = userAchievements.length;
  const percent = total ? Math.round(unlocked / total * 100) : 0;

  const totalXP = userAchievements.reduce((s, a) => s + (a.xp_reward || 0), 0);
  const level = currentUser.level || 1;
  const xp = currentUser.xp || 0;
  const nextLevelXP = level * 100;
  const xpPercent = Math.min(100, (xp / nextLevelXP) * 100);

  const rarest = useMemo(() => {
    const order = { legendary: 4, epic: 3, rare: 2, common: 1 };
    return [...userAchievements].sort((a, b) => (order[b.rarity] || 0) - (order[a.rarity] || 0)).slice(0, 5);
  }, [userAchievements]);

  const unlockedIds = new Set(userAchievements.map(a => a.achievement_id));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🏆 Достижения</div>
      </div>

      <div className="grid grid-2 mb-4">
        <div className="card">
          <div className="flex gap-3" style={{ alignItems: 'center' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg_tertiary)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="8"
                strokeDasharray={`${percent * 2.64} 264`} strokeDashoffset="0"
                transform="rotate(-90 50 50)" strokeLinecap="round" />
              <text x="50" y="55" textAnchor="middle" fill="var(--text_highlight)" fontSize="20" fontWeight="700">{percent}%</text>
            </svg>
            <div>
              <div className="text-highlight" style={{ fontSize: 20, fontWeight: 700 }}>{unlocked} / {total}</div>
              <div className="text-secondary">всего достижений</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="text-secondary mb-2">Уровень {level}</div>
          <div className="progress-bar mb-2"><div className="progress-bar-fill" style={{ width: `${xpPercent}%` }}></div></div>
          <div className="text-secondary" style={{ fontSize: 12 }}>{xp} / {nextLevelXP} XP до уровня {level + 1}</div>
          <div className="text-highlight mt-3" style={{ fontSize: 18, fontWeight: 700 }}>{totalXP} XP</div>
          <div className="text-secondary">заработано всего</div>
        </div>
      </div>

      {rarest.length > 0 && (
        <div className="mb-4">
          <h3 className="text-highlight mb-2">🌟 Редкие достижения</h3>
          <div className="grid grid-3">
            {rarest.map(a => (
              <div key={a.achievement_id} className="achievement-item unlocked">
                <div className="achievement-icon">{a.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{a.name}</div>
                  <div className="achievement-desc">{a.description}</div>
                  <span className={`rarity-${a.rarity}`} style={{ fontSize: 11 }}>{a.rarity.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-highlight mb-2">По играм</h3>
      {allAch.map(({ game, achievements }) => {
        const gameUnlocked = achievements.filter(a => unlockedIds.has(a.id)).length;
        const isOpen = expanded[game.game_id];
        return (
          <div key={game.id} className="card mb-2">
            <div className="flex" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(e => ({ ...e, [game.game_id]: !isOpen }))}>
              <div style={{ width: 60, height: 40, borderRadius: 2, background: `linear-gradient(135deg, ${game.cover_color}, ${game.cover_color2})`, marginRight: 12 }}></div>
              <div className="flex-1">
                <div className="text-highlight" style={{ fontWeight: 600 }}>{game.title}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>{gameUnlocked} / {achievements.length}</div>
                <div className="progress-bar mt-1"><div className="progress-bar-fill" style={{ width: `${achievements.length ? gameUnlocked / achievements.length * 100 : 0}%` }}></div></div>
              </div>
              <span style={{ fontSize: 18 }}>{isOpen ? '▼' : '▶'}</span>
            </div>
            {isOpen && (
              <div className="mt-3">
                {achievements.map(a => {
                  const unl = unlockedIds.has(a.id);
                  return (
                    <div key={a.id} className={`achievement-item ${unl ? 'unlocked' : ''}`} style={{ opacity: unl ? 1 : 0.5 }}>
                      <div className="achievement-icon">{a.icon}</div>
                      <div className="achievement-info">
                        <div className="achievement-name">{a.name}</div>
                        <div className="achievement-desc">{a.description}</div>
                        <span className={`rarity-${a.rarity}`} style={{ fontSize: 11 }}>{a.rarity.toUpperCase()} • +{a.xp_reward} XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
