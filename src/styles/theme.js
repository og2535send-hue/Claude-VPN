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
    border_subtle: '#2d4a6a',
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
    border_subtle: '#c8d6e4',
  },
};

export const ACCENT_COLORS = [
  { name: 'Голубой', value: '#66c0f4' },
  { name: 'Зелёный', value: '#5ba32b' },
  { name: 'Оранжевый', value: '#e08a2b' },
  { name: 'Красный', value: '#c0392b' },
  { name: 'Фиолетовый', value: '#8e44ad' },
  { name: 'Розовый', value: '#e91e63' },
  { name: 'Жёлтый', value: '#f1c40f' },
  { name: 'Белый', value: '#ffffff' },
];

export const PROFILE_BG_COLORS = [
  '#1b2838', '#3a1a5c', '#1a3a5c', '#5c1a1a', '#1a5c3a', '#5c4a1a',
];

export const AVATAR_COLORS = [
  '#1a44c9', '#5ba32b', '#e08a2b', '#c0392b',
  '#8e44ad', '#e91e63', '#16a085', '#34495e',
];

export const RARITY_COLORS = {
  common: '#8ba3b3',
  rare: '#66c0f4',
  epic: '#a655ee',
  legendary: '#f1c40f',
};

export function applyTheme(theme, accentColor, fontSize) {
  const t = themes[theme] || themes.dark;
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => {
    root.style.setProperty(`--${k.replace(/_/g, '-')}`, v);
  });
  if (accentColor) {
    root.style.setProperty('--accent', accentColor);
  }
  const sizes = { small: '13px', medium: '14px', large: '16px' };
  root.style.setProperty('--font-base', sizes[fontSize] || sizes.medium);
}
