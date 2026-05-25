import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function FriendsPanel() {
  const friends = useAppStore((s) => s.friends);
  const messages = useAppStore((s) => s.messages);
  const activeChatFriend = useAppStore((s) => s.activeChatFriend);
  const setActiveChatFriend = useAppStore((s) => s.setActiveChatFriend);
  const toggleFriendsPanel = useAppStore((s) => s.toggleFriendsPanel);
  const loadMessages = useAppStore((s) => s.loadMessages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const currentUser = useAppStore((s) => s.currentUser);

  const [input, setInput] = useState('');

  useEffect(() => {
    if (activeChatFriend) {
      const friendId = activeChatFriend.user_id === currentUser.id
        ? activeChatFriend.friend_id : activeChatFriend.user_id;
      loadMessages(friendId);
    }
  }, [activeChatFriend?.id]);

  const friendId = activeChatFriend
    ? (activeChatFriend.user_id === currentUser.id
        ? activeChatFriend.friend_id : activeChatFriend.user_id)
    : null;

  const chatMessages = friendId ? (messages[friendId] || []) : [];

  const onSend = async () => {
    if (!input.trim() || !friendId) return;
    await sendMessage(friendId, input.trim());
    setInput('');
  };

  return (
    <div className="friends-panel">
      <div style={{
        padding: 12, borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <strong style={{ color: 'var(--text-highlight)' }}>Друзья</strong>
        <FaTimes style={{ cursor: 'pointer' }} onClick={toggleFriendsPanel} />
      </div>

      {!activeChatFriend ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {friends.length === 0 && (
            <div className="empty-state">У вас пока нет друзей</div>
          )}
          {friends.map((f) => (
            <div key={f.id} className="friend-row" onClick={() => setActiveChatFriend(f)}>
              <div
                className="avatar sm"
                style={{ background: f.avatar_color || '#1a44c9' }}
              >
                {f.avatar_initials || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-highlight)' }}>{f.display_name}</div>
                <div className="text-small text-secondary">
                  <span className={`status-dot ${f.status}`} /> {labelStatus(f.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="chat-window">
          <div style={{
            padding: 10, borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '4px 10px' }}
              onClick={() => setActiveChatFriend(null)}
            >
              ←
            </button>
            <div
              className="avatar sm"
              style={{ background: activeChatFriend.avatar_color }}
            >
              {activeChatFriend.avatar_initials}
            </div>
            <strong style={{ color: 'var(--text-highlight)' }}>
              {activeChatFriend.display_name}
            </strong>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="empty-state">Сообщений пока нет</div>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.sender_id === currentUser.id ? 'me' : 'them'}`}>
                <div>{m.content}</div>
                <div className="text-small" style={{ opacity: 0.6, marginTop: 2 }}>
                  {new Date(m.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input-wrap">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Сообщение..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function labelStatus(s) {
  return ({ online: 'Онлайн', 'in-game': 'В игре', offline: 'Оффлайн' })[s] || 'Оффлайн';
}
