import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function FriendsView() {
  const friends = useAppStore(s => s.friends);
  const currentUser = useAppStore(s => s.currentUser);
  const refreshFriends = useAppStore(s => s.refreshFriends);
  const setActiveFriend = useAppStore(s => s.setActiveFriend);
  const toggleFriendsPanel = useAppStore(s => s.toggleFriendsPanel);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  const accepted = friends.filter(f => f.status === 'accepted');
  const incoming = friends.filter(f => f.status === 'pending' && f.friend_id === currentUser.id);
  const outgoing = friends.filter(f => f.status === 'pending' && f.user_id === currentUser.id);

  const handleSearch = async () => {
    if (!search.trim()) return;
    const res = await window.electronAPI.searchUsers(search.trim());
    setSearchResults(res.filter(u => u.id !== currentUser.id));
  };

  const sendRequest = async (username) => {
    setError('');
    const res = await window.electronAPI.sendFriendRequest(currentUser.id, username);
    if (res.success) {
      await refreshFriends();
      setError('Запрос отправлен');
    } else {
      setError(res.error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👥 Друзья</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`btn ${tab === 'all' ? 'primary' : ''}`} onClick={() => setTab('all')}>Все ({accepted.length})</button>
        <button className={`btn ${tab === 'requests' ? 'primary' : ''}`} onClick={() => setTab('requests')}>Запросы ({incoming.length})</button>
        <button className={`btn ${tab === 'find' ? 'primary' : ''}`} onClick={() => setTab('find')}>Найти друзей</button>
      </div>

      {error && <div className="mb-2 text-secondary">{error}</div>}

      {tab === 'all' && (
        <div className="grid grid-2">
          {accepted.length === 0 && <div className="text-secondary">Список друзей пуст</div>}
          {accepted.map(f => (
            <div key={f.id} className="card flex gap-3" style={{ alignItems: 'center' }}>
              <div className="avatar lg" style={{ background: f.avatar_color }}>{f.avatar_initials}</div>
              <div className="flex-1">
                <div className="text-highlight" style={{ fontWeight: 600 }}>{f.display_name}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>@{f.username} • Уровень {f.level || 1}</div>
                <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  <span className="status-dot online"></span> В сети
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn sm primary" onClick={() => { setActiveFriend(f); toggleFriendsPanel(); }}>💬</button>
                <button className="btn sm danger" onClick={async () => {
                  const fid = f.user_id === currentUser.id ? f.friend_id : f.user_id;
                  await window.electronAPI.removeFriend(currentUser.id, fid);
                  await refreshFriends();
                }}>❌</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <>
          <h3 className="text-highlight mb-2">Входящие</h3>
          {incoming.length === 0 && <div className="text-secondary mb-3">Нет входящих запросов</div>}
          {incoming.map(f => (
            <div key={f.id} className="card flex gap-3 mb-2" style={{ alignItems: 'center' }}>
              <div className="avatar md" style={{ background: f.avatar_color }}>{f.avatar_initials}</div>
              <div className="flex-1">
                <div className="text-highlight">{f.display_name}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>@{f.username}</div>
              </div>
              <button className="btn primary sm" onClick={async () => { await window.electronAPI.acceptFriendRequest(f.id); await refreshFriends(); }}>✓ Принять</button>
              <button className="btn danger sm" onClick={async () => {
                await window.electronAPI.removeFriend(currentUser.id, f.user_id);
                await refreshFriends();
              }}>✕ Отклонить</button>
            </div>
          ))}
          <h3 className="text-highlight mb-2 mt-4">Исходящие</h3>
          {outgoing.length === 0 && <div className="text-secondary">Нет исходящих запросов</div>}
          {outgoing.map(f => (
            <div key={f.id} className="card flex gap-3 mb-2" style={{ alignItems: 'center' }}>
              <div className="avatar md" style={{ background: f.avatar_color }}>{f.avatar_initials}</div>
              <div className="flex-1">
                <div className="text-highlight">{f.display_name}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>@{f.username} • Ожидание...</div>
              </div>
              <button className="btn danger sm" onClick={async () => {
                await window.electronAPI.removeFriend(currentUser.id, f.friend_id);
                await refreshFriends();
              }}>Отменить</button>
            </div>
          ))}
        </>
      )}

      {tab === 'find' && (
        <>
          <div className="card flex gap-2 mb-3">
            <input className="input" placeholder="Введите username..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <button className="btn primary" onClick={handleSearch}>Поиск</button>
          </div>
          {searchResults.map(u => (
            <div key={u.id} className="card flex gap-3 mb-2" style={{ alignItems: 'center' }}>
              <div className="avatar md" style={{ background: u.avatar_color }}>{u.avatar_initials}</div>
              <div className="flex-1">
                <div className="text-highlight">{u.display_name}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>@{u.username} • Уровень {u.level || 1}</div>
              </div>
              <button className="btn primary sm" onClick={() => sendRequest(u.username)}>+ Добавить</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
