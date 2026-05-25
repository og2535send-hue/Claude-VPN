import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FaSteam } from 'react-icons/fa';

export default function AuthView() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAppStore(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
          setError('Имя пользователя: 3-20 символов, только a-z 0-9 _');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Пароль минимум 6 символов');
          setLoading(false);
          return;
        }
        if (password !== confirmPwd) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }
        const res = await window.electronAPI.register(username, displayName || username, password);
        if (!res.success) {
          setError(res.error || 'Ошибка регистрации');
          setLoading(false);
          return;
        }
        const loginRes = await window.electronAPI.login(username, password);
        if (loginRes.success) {
          await login(loginRes.user, remember);
        } else {
          setError(loginRes.error || 'Не удалось войти');
        }
      } else {
        const res = await window.electronAPI.login(username, password);
        if (!res.success) {
          setError(res.error || 'Ошибка входа');
          setLoading(false);
          return;
        }
        await login(res.user, remember);
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <FaSteam size={36} color="var(--accent)" />
          STEAM
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label className="label">Имя пользователя</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        {mode === 'register' && (
          <div className="form-group">
            <label className="label">Отображаемое имя</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label className="label">Пароль</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {mode === 'register' && (
          <div className="form-group">
            <label className="label">Подтверждение пароля</label>
            <input className="input" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required />
          </div>
        )}
        {mode === 'login' && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Запомнить меня
            </label>
          </div>
        )}
        <button className="btn primary w-full" type="submit" disabled={loading}>
          {loading ? '...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
        </button>
        <div className="auth-switch">
          {mode === 'login' ? (
            <>Нет аккаунта? <button type="button" onClick={() => { setMode('register'); setError(''); }}>Создать</button></>
          ) : (
            <>Уже есть аккаунт? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Войти</button></>
          )}
        </div>
      </form>
    </div>
  );
}
