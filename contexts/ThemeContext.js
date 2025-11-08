import React, { createContext } from 'react';
import { darkColors } from '../services/themeService';

// Theme Context
export const ThemeContext = createContext({
  theme: 'dark',
  colors: darkColors,
  setTheme: () => {},
  toggleTheme: () => {},
});

