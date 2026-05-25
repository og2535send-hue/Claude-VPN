# Steam Client (Electron)

Кастомный Steam-клиент — десктопное приложение на Electron + React + SQLite. Полностью локальное, работает без интернета.

## Стек

- Electron 29 + electron-builder
- React 18 + Vite
- better-sqlite3 (локальная БД в `%APPDATA%/steam-client/steam.db`)
- Zustand (глобальный стор)
- bcryptjs (хэширование паролей)
- framer-motion (анимации)
- react-icons (иконки)

## Запуск (Windows)

```bash
npm install
npm start       # dev (Vite + Electron)
npm run build   # сборка .exe (NSIS)
```

После `npm run build` готовый установщик будет в `dist-electron/`:
- `Steam Client Setup 1.0.0.exe` — установщик
- `win-unpacked/Steam Client.exe` — портативная версия

## Возможности

- Регистрация / вход с локальным bcrypt
- Авто-логин («запомнить меня»)
- Библиотека игр с сортировкой, фильтрами, контекстным меню
- Магазин с фильтрами, корзиной, скидками
- 12 предустановленных игр (Garry's Mod, Rust, Subnautica, Valheim и др.)
- Достижения по играм (10 шаблонов × 12 игр), редкость, XP, уровни
- Загрузки с симуляцией прогресса (анимация каждые 500мс)
- Друзья: поиск, запросы, чат с сохранением сообщений в SQLite
- Профиль с кастомизацией: цвет аватара, инициалы, фон, витрина
- Лог активности
- Настройки: тёмная/светлая темы, акцентный цвет, размер шрифта, уведомления
- Системный трей (свернуть в трей при закрытии, смена статуса)
- Кастомный заголовок окна (frameless)

## Структура

```
.
├── main.js                    # Electron main process
├── preload.js                 # IPC bridge (contextBridge)
├── package.json
├── electron-builder.yml
├── vite.config.js
├── assets/icon.png            # 256×256 иконка приложения
└── src/
    ├── db.js                  # SQLite + seed
    ├── ipc-handlers.js        # все IPC обработчики
    ├── index.html / index.jsx
    ├── App.jsx
    ├── components/            # TopBar, Sidebar, FriendsPanel, Modal, StatusBar
    ├── views/                 # 10 экранов
    ├── store/useAppStore.js
    └── styles/                # global.css, theme.js
```

## Заметка о сборке

`better-sqlite3` — нативный модуль. На Windows прекомпилированные бинарники подтянутся автоматически.
На Linux/Mac может потребоваться Python 3 + build tools.
