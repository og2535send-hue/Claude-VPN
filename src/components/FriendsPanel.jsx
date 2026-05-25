import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function FriendsPanel() {
  const isOpen = useAppStore(s => s.isFriendsPanelOpen);
  const toggleFriendsPanel = useAppStore(s => s.toggleFriendsPanel);
  const friends = useAppStore(s => s.friends);
  const currentUser = useAppStore(s => s.currentUser);
  const activeFriend = useAppStore(s => s.activeFriend);
  const setActiveFriend = useAppStore(s => s.setActiveFriend);
  const messages = useAppStore(s => s.messages);
  const loadMessages = useAppStore(s => s.loadMessages);
  const sendMessage = useAppStore(s => s.sendMessage);
  const [input, setInput] = useState('');

  const accepted = friends.filter(f => f.status === 'accepted');

  useEffect(() => {
    if (activeFriend) {
      const fid = activeFriend.user_id === currentUser.id ? activeFriend.friend_id : activeFriend.user_id;
      loadMessages(fid);
    }
  }, [activeFriend]);

  const handleSend = async () => {
    if (!input.trim() || !activeFriend) return;
    const fid = activeFriend.user_id === currentUser.id ? activeFriend.friend_id : activeFriend.user_id;
    await sendMessage(fid, input.trim());
    setInput('');
  };

  if (!isOpen) return null;
  const activeFid = activeFriend && (activeFriend.user_id === currentUser.id ? activeFriend.friend_id : activeFriend.user_id);
  const msgs = activeFid ? (messages[activeFid] || []) : [];

  return (
    <div className={`friends-panel ${isOpen ? 'open' : ''}`}>
      <div className="friends-panel-header">
        <strong>Друзья ({accepted.length})</strong>
        <button onClick={toggleFriendsPanel}><FaTimes /></button>
      </div>
      <div className="friends-list">
        {accepted.length === 0 && <div style={{ padding: 16, color: 'var(--text_secondary)' }}>Пока никого нет</div>}
        {accepted.map(f => (
          <div key={f.id} className="friend-item" onClick={() => setActiveFriend(f)}>
            <div className="avatar sm" style={{ background: f.avatar_color }}>{f.avatar_initials}</div>
            <div className="friend-info">
              <div className="friend-name">{f.display_name}</div>
              <div className="friend-status">
                <span className={`status-dot ${f.status === 'accepted' ? 'online' : 'offline'}`}></span>{' '}
                Онлайн
              </div>
            </div>
          </div>
        ))}
      </div>
      {activeFriend && (
        <div className="chat-window">
          <div style={{ fontWeight: 600, color: 'var(--text_highlight)', marginBottom: 8 }}>
            💬 {activeFriend.display_name}
          </div>
          <div className="chat-messages">
            {msgs.length === 0 && <div className="text-secondary" style={{ fontSize: 12 }}>Нет сообщений</div>}
            {msgs.map(m => (
              <div key={m.id} className={`chat-msg ${m.sender_id === currentUser.id ? 'me' : 'them'}`}>
                <div>{m.content}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                  {new Date(m.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input-wrap">
            <input
              className="input"
              placeholder="Сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn primary" onClick={handleSend}><FaPaperPlane /></button>
          </div>
        </div>
      )}
    </div>
  );
}
