import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { accentColors } from '../styles/theme';

export default function SettingsView() {
  const currentUser = useAppStore(s => s.currentUser);
  const settings = useAppStore(s => s.settings);
  const applySettings = useAppStore(s => s.applySettings);
  const logout = useAppStore(s => s.logout);
  const setCurrentUser = useAppStore(s => s.setCurrentUser);
  const openModal = useAppStore(s => s.openModal);
  const [section, setSection] = useState('account');
  const [userDataPath, setUserDataPath] = useState('');
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    window.electronAPI.getUserDataPath().then(setUserDataPath).catch(() => {});
    window.electronAPI.getAppVersion().then(setAppVersion).catch(() => {});
  }, []);

  const update = async (fields) => {
    await window.electronAPI.updateSettings(currentUser.id, fields);
    const s = await window.electronAPI.getSettings(currentUser.id);
    applySettings(s);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ Настройки</div>
      </div>
      <div className="settings-layout">
        <div className="settings-nav">
          {[
            ['account', 'Аккаунт'],
            ['appearance', 'Внешний вид'],
            ['notifications', 'Уведомления'],
            ['downloads', 'Загрузки'],
            ['interface', 'Интерфейс'],
            ['about', 'О программе']
          ].map(([k, label]) => (
            <button key={k} className={`settings-nav-item ${section === k ? 'active' : ''}`} onClick={() => setSection(k)}>{label}</button>
          ))}
          <button className="settings-nav-item" onClick={logout} style={{ marginTop: 12, color: '#ff8e88' }}>🚪 Выйти</button>
        </div>
        <div className="settings-content">
          {section === 'account' && <AccountSection currentUser={currentUser} setCurrentUser={setCurrentUser} logout={logout} openModal={openModal} />}
          {section === 'appearance' && <AppearanceSection settings={settings} update={update} />}
          {section === 'notifications' && <NotificationsSection settings={settings} update={update} />}
          {section === 'downloads' && <DownloadsSection settings={settings} update={update} userDataPath={userDataPath} />}
          {section === 'interface' && <InterfaceSection settings={settings} update={update} />}
          {section === 'about' && <AboutSection version={appVersion} userDataPath={userDataPath} />}
        </div>
      </div>
    </div>
  );
}

function AccountSection({ currentUser, setCurrentUser, logout, openModal }) {
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState('');
  const [deletePwd, setDeletePwd] = useState('');

  const saveDisplayName = async () => {
    await window.electronAPI.updateProfile(currentUser.id, { displayName });
    const u = await window.electronAPI.getProfile(currentUser.id);
    setCurrentUser(u);
    setMsg('Имя обновлено');
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setMsg('Пароли не совпадают'); return; }
    const res = await window.electronAPI.updatePassword(currentUser.id, oldPwd, newPwd);
    setMsg(res.success ? 'Пароль изменён' : (res.error || 'Ошибка'));
    if (res.success) { setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }
  };

  const deleteAccount = async () => {
    const res = await window.electronAPI.deleteAccount(currentUser.id, deletePwd);
    if (res.success) {
      logout();
    } else {
      setMsg(res.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="card">
      <h3 className="text-highlight mb-3">Аккаунт</h3>
      {msg && <div className="error-msg" style={{ background: 'rgba(102,192,244,0.15)', borderColor: 'var(--accent)', color: 'var(--text_highlight)' }}>{msg}</div>}
      <div className="form-group">
        <label className="label">Отображаемое имя</label>
        <div className="flex gap-2">
          <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <button className="btn primary" onClick={saveDisplayName}>Сохранить</button>
        </div>
      </div>
      <hr style={{ borderColor: 'var(--border_subtle)', margin: '16px 0' }} />
      <h4 className="text-highlight mb-2">Сменить пароль</h4>
      <div className="form-group"><label className="label">Старый пароль</label><input type="password" className="input" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} /></div>
      <div className="form-group"><label className="label">Новый пароль</label><input type="password" className="input" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></div>
      <div className="form-group"><label className="label">Подтверждение</label><input type="password" className="input" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} /></div>
      <button className="btn primary" onClick={changePassword}>Изменить пароль</button>

      <hr style={{ borderColor: 'var(--border_subtle)', margin: '16px 0' }} />
      <h4 className="text-highlight mb-2" style={{ color: '#ff8e88' }}>Опасная зона</h4>
      <div className="form-group">
        <label className="label">Удалить аккаунт (введите пароль)</label>
        <input type="password" className="input" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
      </div>
      <button className="btn danger" onClick={() => openModal('confirm', { title: 'Удалить аккаунт?', message: 'Это действие необратимо.', onConfirm: deleteAccount })}>Удалить аккаунт</button>
    </div>
  );
}

function AppearanceSection({ settings, update }) {
  return (
    <div className="card">
      <h3 className="text-highlight mb-3">Внешний вид</h3>
      <div className="setting-row">
        <div className="setting-label">Тема</div>
        <select className="select" style={{ width: 160 }} value={settings.theme || 'dark'} onChange={(e) => update({ theme: e.target.value })}>
          <option value="dark">Тёмная</option>
          <option value="light">Светлая</option>
          <option value="auto">Авто (System)</option>
        </select>
      </div>
      <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div className="setting-label">Акцентный цвет</div>
        <div className="color-swatches">
          {accentColors.map(c => (
            <div key={c.value} className={`color-swatch ${settings.accent_color === c.value ? 'active' : ''}`} style={{ background: c.value }} onClick={() => update({ accent_color: c.value })}></div>
          ))}
          <input type="color" value={settings.accent_color || '#66c0f4'} onChange={(e) => update({ accent_color: e.target.value })} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-label">Размер шрифта</div>
        <select className="select" style={{ width: 160 }} value={settings.font_size || 'medium'} onChange={(e) => update({ font_size: e.target.value })}>
          <option value="small">Маленький</option>
          <option value="medium">Средний</option>
          <option value="large">Большой</option>
        </select>
      </div>
    </div>
  );
}

function NotificationsSection({ settings, update }) {
  return (
    <div className="card">
      <h3 className="text-highlight mb-3">Уведомления</h3>
      <ToggleRow label="Включить уведомления" value={settings.notifications_enabled} onChange={(v) => update({ notifications_enabled: v })} />
      <ToggleRow label="Друзья онлайн" value={settings.show_friends_online} onChange={(v) => update({ show_friends_online: v })} />
    </div>
  );
}

function DownloadsSection({ settings, update, userDataPath }) {
  return (
    <div className="card">
      <h3 className="text-highlight mb-3">Загрузки</h3>
      <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div className="setting-label">Папка загрузок</div>
        <div className="text-secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>{userDataPath}</div>
      </div>
      <div className="setting-row">
        <div className="setting-label">Ограничение скорости (МБ/с, 0 = безлимит)</div>
        <input type="number" min="0" max="1000" className="input" style={{ width: 100 }} value={settings.download_limit_mbps || 0} onChange={(e) => update({ download_limit_mbps: Number(e.target.value) })} />
      </div>
    </div>
  );
}

function InterfaceSection({ settings, update }) {
  return (
    <div className="card">
      <h3 className="text-highlight mb-3">Интерфейс</h3>
      <ToggleRow label="Запускать при старте Windows" value={settings.startup_with_windows} onChange={async (v) => {
        await update({ startup_with_windows: v });
        try { await window.electronAPI.setLoginItem(v); } catch (e) {}
      }} />
      <ToggleRow label="Сворачивать в трей при закрытии" value={settings.minimize_to_tray} onChange={(v) => update({ minimize_to_tray: v })} />
      <div className="setting-row">
        <div className="setting-label">Язык</div>
        <select className="select" style={{ width: 160 }} value={settings.language || 'ru'} onChange={(e) => update({ language: e.target.value })}>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

function AboutSection({ version, userDataPath }) {
  return (
    <div className="card">
      <h3 className="text-highlight mb-3">О программе</h3>
      <div className="setting-row">
        <div className="setting-label">Версия</div>
        <div>{version}</div>
      </div>
      <div className="setting-row">
        <div className="setting-label">Папка данных</div>
        <div className="text-secondary" style={{ fontSize: 12, wordBreak: 'break-all', maxWidth: 400 }}>{userDataPath}</div>
      </div>
      <button className="btn primary mt-2">Проверить обновления</button>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-label">{label}</div>
      <div className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(value ? 0 : 1)}></div>
    </div>
  );
}
