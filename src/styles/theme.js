export const themes = {
  dark: {
    bg_primary: '#1b2838',
    bg_secondary: '#2a475e',
    bg_tertiary: '#171a21',
    bg_panel: '#1e2a3a',
    text_primary: '#c6d4df',
    text_secondary: '#8ba3b3',
    text_highlight: '#ffffff',
    accent: '#66c0f4',
    accent_hover: '#4fa8e0',
    button_green: '#4c6b22',
    button_green_hover: '#5c8a2a',
    border: '#4a6a8a',
    border_subtle: '#2d4a6a'
  },
  light: {
    bg_primary: '#f0f4f8',
    bg_secondary: '#dce6ef',
    bg_tertiary: '#c8d6e4',
    bg_panel: '#e4edf5',
    text_primary: '#1b2838',
    text_secondary: '#4a6a8a',
    text_highlight: '#000000',
    accent: '#1a6b9a',
    accent_hover: '#1459a8',
    button_green: '#4c6b22',
    button_green_hover: '#5c8a2a',
    border: '#aabcce',
    border_subtle: '#c8d6e4'
  }
};

export const accentColors = [
  { name: 'Голубой', value: '#66c0f4' },
  { name: 'Зелёный', value: '#5c8a2a' },
  { name: 'Оранжевый', value: '#e07a3e' },
  { name: 'Красный', value: '#c9352d' },
  { name: 'Фиолетовый', value: '#9b59b6' },
  { name: 'Розовый', value: '#e91e63' },
  { name: 'Жёлтый', value: '#f1c40f' },
  { name: 'Белый', value: '#ecf0f1' }
];

export function applyTheme(themeName, accent, fontSize) {
  const t = themes[themeName] || themes.dark;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t)) {
    root.style.setProperty(`--${k}`, v);
  }
  if (accent) {
    root.style.setProperty('--accent', accent);
  }
  const sizes = { small: '13px', medium: '14px', large: '16px' };
  root.style.setProperty('--base-font-size', sizes[fontSize] || sizes.medium);
}
