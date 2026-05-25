import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ACCENT_COLORS } from '../styles/theme';

const SECTIONS = [
  { k: 'account', l: 'Аккаунт' },
  { k: 'appearance', l: 'Внешний вид' },
  { k: 'notifications', l: 'Уведомления' },
  { k: 'downloads', l: 'Загрузки' },
  { k: 'interface', l: 'Интерфейс' },
  { k: 'about', l: 'О программе' },
];

export default function SettingsView() {
  const [section, setSection] = useState('account');

  return (
    <div className="view-container">
      <h1 className="view-title">Настройки</h1>
      <div className="settings-layout">
        <div className="settings-nav">
          {SECTIONS.map((s) => (
            <div
              key={s.k}
              className={`settings-nav-item ${section === s.k ? 'active' : ''}`}
              onClick={() => setSection(s.k)}
            >
              {s.l}
            </div>
          ))}
        </div>
        <div className="settings-content">
          {section === 'account' && <AccountSection />}
          {section === 'appearance' && <AppearanceSection />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'downloads' && <DownloadsSection />}
          {section === 'interface' && <InterfaceSection />}
          {section === 'about' && <AboutSection />}
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const user = useAppStore((s) => s.currentUser);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const openModal = useAppStore((s) => s.openModal);
  const showToast = useAppStore((s) => s.showToast);
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  const saveName = async () => {
    await window.electronAPI.updateProfile(user.id, { displayName });
    await refreshProfile();
    showToast('Имя обновлено');
  };

  return (
    <div>
      <h3 className="section-title">Аккаунт</h3>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Имя пользователя</strong>
          <small>@{user?.username}</small>
        </div>
        <input value={user?.username} disabled style={{ width: 200 }} />
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Отображаемое имя</strong>
        </div>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: 200 }}
        />
        <button className="btn btn-primary" onClick={saveName}>Сохранить</button>
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Пароль</strong>
          <small>Изменить пароль аккаунта</small>
        </div>
        <button className="btn btn-secondary" onClick={() => openModal({ type: 'change-password' })}>
          Изменить пароль
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Удалить аккаунт</strong>
          <small>Безвозвратное удаление всех данных</small>
        </div>
        <button className="btn btn-danger" onClick={() => openModal({ type: 'delete-account' })}>
          Удалить
        </button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const settings = useAppStore((s) => s.settings);
  const currentUser = useAppStore((s) => s.currentUser);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [accent, setAccent] = useState(settings.accent_color || '#66c0f4');
  const [fontSize, setFontSize] = useState(settings.font_size || 'medium');
  const [animations, setAnimations] = useState(true);
  const [compact, setCompact] = useState(false);

  const save = async (patch) => {
    const newSettings = { theme, accent_color: accent, font_size: fontSize, ...patch };
    await window.electronAPI.updateSettings(currentUser.id, newSettings);
    useAppStore.setState((s) => ({ settings: { ...s.settings, ...newSettings } }));
  };

  return (
    <div>
      <h3 className="section-title">Внешний вид</h3>
      <div className="setting-row">
        <div className="setting-label"><strong>Тема</strong></div>
        <select value={theme} onChange={(e) => { setTheme(e.target.value); save({ theme: e.target.value }); }}>
          <option value="dark">Тёмная</option>
          <option value="light">Светлая</option>
          <option value="auto">Авто (System)</option>
        </select>
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Акцентный цвет</strong></div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {ACCENT_COLORS.map((c) => (
            <div
              key={c.value}
              className={`color-swatch ${accent === c.value ? 'selected' : ''}`}
              style={{ background: c.value, width: 24, height: 24 }}
              onClick={() => { setAccent(c.value); save({ accent_color: c.value }); }}
              title={c.name}
            />
          ))}
          <input
            type="color"
            value={accent}
            onChange={(e) => { setAccent(e.target.value); save({ accent_color: e.target.value }); }}
            style={{ width: 28, height: 28 }}
          />
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Размер шрифта</strong></div>
        <select
          value={fontSize}
          onChange={(e) => { setFontSize(e.target.value); save({ font_size: e.target.value }); }}
        >
          <option value="small">Маленький</option>
          <option value="medium">Средний</option>
          <option value="large">Большой</option>
        </select>
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Анимации</strong></div>
        <div className={`toggle ${animations ? 'on' : ''}`} onClick={() => setAnimations(!animations)} />
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Компактный режим</strong></div>
        <div className={`toggle ${compact ? 'on' : ''}`} onClick={() => setCompact(!compact)} />
      </div>
    </div>
  );
}

function NotificationsSection() {
  const currentUser = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);
  const [items, setItems] = useState({
    friends: !!settings.notifications_enabled,
    achievements: true,
    sales: true,
    sound: true,
  });

  const update = async (k, v) => {
    setItems((s) => ({ ...s, [k]: v }));
    if (k === 'friends') {
      await window.electronAPI.updateSettings(currentUser.id, { notifications_enabled: v ? 1 : 0 });
    }
  };

  return (
    <div>
      <h3 className="section-title">Уведомления</h3>
      {[
        ['friends', 'Уведомления о входе друзей'],
        ['achievements', 'Уведомления о достижениях'],
        ['sales', 'Уведомления о скидках'],
        ['sound', 'Звук уведомлений'],
      ].map(([k, l]) => (
        <div key={k} className="setting-row">
          <div className="setting-label"><strong>{l}</strong></div>
          <div className={`toggle ${items[k] ? 'on' : ''}`} onClick={() => update(k, !items[k])} />
        </div>
      ))}
    </div>
  );
}

function DownloadsSection() {
  const currentUser = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);
  const [limit, setLimit] = useState(settings.download_limit_mbps || 0);
  const [autoStart, setAutoStart] = useState(true);
  const [path, setPath] = useState('C:\\Program Files\\SteamLibrary');

  const saveLimit = async (v) => {
    setLimit(v);
    await window.electronAPI.updateSettings(currentUser.id, { download_limit_mbps: v });
  };

  return (
    <div>
      <h3 className="section-title">Загрузки</h3>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Папка загрузок</strong>
          <small>{path}</small>
        </div>
        <button className="btn btn-secondary">Изменить</button>
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Ограничение скорости (MB/s)</strong>
          <small>0 = без ограничения</small>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={limit}
          onChange={(e) => saveLimit(parseFloat(e.target.value))}
          style={{ width: 180 }}
        />
        <span style={{ minWidth: 50, textAlign: 'right' }}>
          {limit === 0 ? 'Безлимит' : `${limit} MB/s`}
        </span>
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Авто-разгрузка после установки</strong></div>
        <div className={`toggle ${autoStart ? 'on' : ''}`} onClick={() => setAutoStart(!autoStart)} />
      </div>
    </div>
  );
}

function InterfaceSection() {
  const currentUser = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);
  const [startup, setStartup] = useState(!!settings.startup_with_windows);
  const [minimize, setMinimize] = useState(settings.minimize_to_tray !== 0);
  const [showTray, setShowTray] = useState(true);
  const [lang, setLang] = useState(settings.language || 'ru');

  const setStartupSetting = async (v) => {
    setStartup(v);
    await window.electronAPI.updateSettings(currentUser.id, { startup_with_windows: v ? 1 : 0 });
    if (window.electronAPI.setStartup) await window.electronAPI.setStartup(v);
  };

  const setMinimizeSetting = async (v) => {
    setMinimize(v);
    await window.electronAPI.updateSettings(currentUser.id, { minimize_to_tray: v ? 1 : 0 });
  };

  const setLangSetting = async (v) => {
    setLang(v);
    await window.electronAPI.updateSettings(currentUser.id, { language: v });
  };

  return (
    <div>
      <h3 className="section-title">Интерфейс</h3>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Запускать при старте Windows</strong>
        </div>
        <div className={`toggle ${startup ? 'on' : ''}`} onClick={() => setStartupSetting(!startup)} />
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Сворачивать в трей при закрытии</strong>
        </div>
        <div className={`toggle ${minimize ? 'on' : ''}`} onClick={() => setMinimizeSetting(!minimize)} />
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Показывать в трее</strong>
        </div>
        <div className={`toggle ${showTray ? 'on' : ''}`} onClick={() => setShowTray(!showTray)} />
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Язык</strong></div>
        <select value={lang} onChange={(e) => setLangSetting(e.target.value)}>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

function AboutSection() {
  const [version, setVersion] = useState('1.0.0');
  const [userPath, setUserPath] = useState('');
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(setVersion);
    }
    if (window.electronAPI?.getUserDataPath) {
      window.electronAPI.getUserDataPath().then(setUserPath);
    }
  }, []);

  return (
    <div>
      <h3 className="section-title">О программе</h3>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Steam Client</strong>
          <small>Версия {version}</small>
        </div>
      </div>
      <div className="setting-row">
        <div className="setting-label"><strong>Обновления</strong></div>
        <button className="btn btn-primary" onClick={() => showToast('У вас последняя версия')}>
          Проверить обновления
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-label">
          <strong>Папка данных</strong>
          <small>{userPath}</small>
        </div>
        <button className="btn btn-secondary" onClick={() => showToast('Откройте проводник вручную')}>
          Открыть папку
        </button>
      </div>
    </div>
  );
}
