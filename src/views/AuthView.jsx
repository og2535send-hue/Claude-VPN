import React, { useState } from 'react';
import { FaSteam } from 'react-icons/fa';
import { useAppStore } from '../store/useAppStore';

export default function AuthView() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAppStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
          setError('Имя пользователя: только a-z, 0-9, _ (3-20 символов)');
          return;
        }
        if (!displayName.trim()) {
          setError('Введите отображаемое имя');
          return;
        }
        if (password.length < 6) {
          setError('Пароль должен быть не менее 6 символов');
          return;
        }
        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          return;
        }
        const res = await window.electronAPI.register(username, displayName.trim(), password);
        if (!res.success) {
          setError(res.error || 'Ошибка регистрации');
          return;
        }
        const loginRes = await window.electronAPI.login(username, password);
        if (!loginRes.success) {
          setError(loginRes.error || 'Ошибка входа');
          return;
        }
        await login(loginRes.user, remember);
      } else {
        if (!username || !password) {
          setError('Введите имя пользователя и пароль');
          return;
        }
        const res = await window.electronAPI.login(username, password);
        if (!res.success) {
          setError(res.error || 'Ошибка входа');
          return;
        }
        await login(res.user, remember);
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <FaSteam color="#66c0f4" />
          <span>STEAM</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Отображаемое имя</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <label htmlFor="remember" style={{ margin: 0, textTransform: 'none', fontSize: 12 }}>
                Запомнить меня
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: 12, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>
              Нет аккаунта?
              <button onClick={() => { setMode('register'); setError(''); }}>
                Создать
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?
              <button onClick={() => { setMode('login'); setError(''); }}>
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
