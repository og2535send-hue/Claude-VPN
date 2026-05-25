import React, { useState } from 'react';
import { FaCommentDots, FaUserPlus, FaTimes, FaCheck, FaGamepad } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function FriendsView() {
  const friends = useAppStore((s) => s.friends);
  const friendRequests = useAppStore((s) => s.friendRequests);
  const refreshFriends = useAppStore((s) => s.refreshFriends);
  const currentUser = useAppStore((s) => s.currentUser);
  const setActiveChatFriend = useAppStore((s) => s.setActiveChatFriend);
  const toggleFriendsPanel = useAppStore((s) => s.toggleFriendsPanel);
  const isFriendsPanelOpen = useAppStore((s) => s.isFriendsPanelOpen);
  const showToast = useAppStore((s) => s.showToast);

  const [tab, setTab] = useState('all');
  const [sortMode, setSortMode] = useState('online');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const incoming = friendRequests.filter((r) => r.direction === 'incoming');
  const outgoing = friendRequests.filter((r) => r.direction === 'outgoing');

  const sortedFriends = [...friends].sort((a, b) => {
    if (sortMode === 'online') {
      const aOn = a.status === 'online' || a.status === 'in-game';
      const bOn = b.status === 'online' || b.status === 'in-game';
      if (aOn !== bOn) return aOn ? -1 : 1;
    }
    return (a.display_name || '').localeCompare(b.display_name || '');
  });

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await window.electronAPI.searchUsers(currentUser.id, search.trim());
    setSearchResults(res || []);
  };

  const sendRequest = async (username) => {
    const res = await window.electronAPI.sendFriendRequest(currentUser.id, username);
    if (res.success) {
      showToast('Запрос отправлен');
      await refreshFriends();
    } else {
      showToast(res.error || 'Ошибка');
    }
  };

  const acceptRequest = async (id) => {
    await window.electronAPI.acceptFriendRequest(id);
    showToast('Запрос принят');
    await refreshFriends();
  };

  const rejectRequest = async (id) => {
    await window.electronAPI.rejectFriendRequest(id);
    await refreshFriends();
  };

  const removeFriend = async (friendUserId) => {
    await window.electronAPI.removeFriend(currentUser.id, friendUserId);
    showToast('Друг удалён');
    await refreshFriends();
  };

  const openChat = (f) => {
    setActiveChatFriend(f);
    if (!isFriendsPanelOpen) toggleFriendsPanel();
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Друзья</h1>

      <div className="tabbar mb-2">
        {[
          ['all', `Все друзья (${friends.length})`],
          ['requests', `Запросы (${incoming.length})`],
          ['find', 'Найти друзей'],
        ].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {l}
          </div>
        ))}
      </div>

      {tab === 'all' && (
        <div>
          <div className="row mb-2">
            <span className="text-secondary">Сортировать:</span>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="online">Онлайн сначала</option>
              <option value="alpha">По алфавиту</option>
            </select>
          </div>
          <div className="grid grid-2">
            {sortedFriends.map((f) => (
              <div key={f.id} className="game-card p-2 row">
                <div className="avatar md" style={{ background: f.avatar_color }}>
                  {f.avatar_initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{f.display_name}</div>
                  <div className="text-small text-secondary">
                    <span className={`status-dot ${f.status}`} /> {labelStatus(f.status)}
                  </div>
                  <div className="text-small text-secondary">@{f.username}</div>
                </div>
                <div className="col" style={{ gap: 4 }}>
                  <button className="btn btn-secondary" onClick={() => openChat(f)}>
                    <FaCommentDots />
                  </button>
                  <button className="btn btn-secondary">
                    <FaGamepad />
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const friendUserId = f.user_id === currentUser.id ? f.friend_id : f.user_id;
                      removeFriend(friendUserId);
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {sortedFriends.length === 0 && <div className="empty-state">У вас пока нет друзей</div>}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          <h3 className="section-title">Входящие</h3>
          {incoming.length === 0 ? (
            <div className="empty-state">Нет входящих запросов</div>
          ) : (
            incoming.map((r) => (
              <div key={r.id} className="row game-card p-2 mb-1">
                <div className="avatar md" style={{ background: r.avatar_color }}>
                  {r.avatar_initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{r.display_name}</div>
                  <div className="text-small text-secondary">@{r.username}</div>
                </div>
                <button className="btn btn-green" onClick={() => acceptRequest(r.id)}>
                  <FaCheck /> Принять
                </button>
                <button className="btn btn-danger" onClick={() => rejectRequest(r.id)}>
                  <FaTimes /> Отклонить
                </button>
              </div>
            ))
          )}

          <h3 className="section-title mt-2">Исходящие</h3>
          {outgoing.length === 0 ? (
            <div className="empty-state">Нет исходящих запросов</div>
          ) : (
            outgoing.map((r) => (
              <div key={r.id} className="row game-card p-2 mb-1">
                <div className="avatar md" style={{ background: r.avatar_color }}>
                  {r.avatar_initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{r.display_name}</div>
                  <div className="text-small text-secondary">@{r.username}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => rejectRequest(r.id)}>
                  Отменить
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'find' && (
        <div>
          <div className="row mb-2">
            <input
              placeholder="Введите имя пользователя..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              Искать
            </button>
          </div>
          {searchResults.length === 0 && search && (
            <div className="empty-state">Ничего не найдено</div>
          )}
          <div className="grid grid-2">
            {searchResults.map((u) => (
              <div key={u.id} className="row game-card p-2">
                <div className="avatar md" style={{ background: u.avatar_color }}>
                  {u.avatar_initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-highlight)' }}>{u.display_name}</div>
                  <div className="text-small text-secondary">@{u.username}</div>
                </div>
                <button className="btn btn-primary" onClick={() => sendRequest(u.username)}>
                  <FaUserPlus /> Добавить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function labelStatus(s) {
  return ({ online: 'Онлайн', 'in-game': 'В игре', offline: 'Оффлайн' })[s] || 'Оффлайн';
}
