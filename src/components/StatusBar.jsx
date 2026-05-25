import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function StatusBar() {
  const user = useAppStore((s) => s.currentUser);
  const downloads = useAppStore((s) => s.downloads);
  const friends = useAppStore((s) => s.friends);

  const activeDownloads = downloads.filter((d) => d.status === 'downloading').length;
  const onlineFriends = friends.filter((f) => f.status === 'online' || f.status === 'in-game').length;

  return (
    <div className="statusbar">
      <span>
        <span className={`status-dot ${user?.status || 'online'}`} /> {' '}
        {user?.display_name}
      </span>
      <span>•</span>
      <span>{onlineFriends} друзей онлайн</span>
      <span>•</span>
      <span>{activeDownloads} активных загрузок</span>
      <div className="spacer" />
      <span>XP: {user?.xp || 0}</span>
      <span>•</span>
      <span>Уровень {user?.level || 1}</span>
    </div>
  );
}
