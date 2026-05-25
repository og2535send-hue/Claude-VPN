# Steam Client (Electron + React + SQLite)

Кастомный Steam-подобный desktop-клиент на Electron + React + SQLite.

## Стек
- Electron 29 (frame-less window + tray)
- React 18 + Vite
- better-sqlite3 (локальное хранилище в `app.getPath('userData')/steam.db`)
- Zustand (глобальный стор)
- bcryptjs (хеширование паролей)
- framer-motion, react-icons

## Установка

```bash
npm install
```

На Windows native-зависимости (`better-sqlite3`) собираются автоматически через node-gyp.
Если возникают ошибки сборки, установите [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools).

## Разработка

```bash
npm start
```

Запускает Vite dev server (http://localhost:5173) и Electron.

## Сборка .exe

```bash
npm run build
```

Готовый installer появится в папке `release/` (например, `release/Steam Client Setup 1.0.0.exe`).
Распакованная сборка — в `release/win-unpacked/Steam Client.exe`.

## Структура

```
steam-client/
├── package.json
├── electron-builder.yml
├── main.js              # Electron main
├── preload.js           # IPC bridge
├── src/
│   ├── db.js            # SQLite layer
│   ├── ipc-handlers.js
│   ├── index.html / index.jsx
│   ├── App.jsx
│   ├── components/      # TopBar / Sidebar / Modal / ...
│   ├── views/           # Auth / Home / Library / Store / Profile / ...
│   ├── store/           # Zustand
│   └── styles/
└── assets/icon.png
```

Все данные хранятся локально (offline-first). Первый запуск показывает экран регистрации.
