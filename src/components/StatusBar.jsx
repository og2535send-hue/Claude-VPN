import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaUsers } from 'react-icons/fa';

export default function StatusBar() {
  const friends = useAppStore(s => s.friends);
  const toggleFriendsPanel = useAppStore(s => s.toggleFriendsPanel);
  const downloads = useAppStore(s => s.downloads);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const onlineFriends = friends.filter(f => f.status === 'accepted').length;
  const activeDownloads = downloads.filter(d => d.status === 'downloading').length;

  return (
    <div className="statusbar">
      <span>🟢 Соединение установлено</span>
      <span>•</span>
      <span style={{ cursor: 'pointer' }} onClick={toggleFriendsPanel}>
        <FaUsers /> Друзья онлайн: {onlineFriends}
      </span>
      {activeDownloads > 0 && (
        <>
          <span>•</span>
          <span>📥 Активных загрузок: {activeDownloads}</span>
        </>
      )}
      <span style={{ marginLeft: 'auto' }}>{time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}
