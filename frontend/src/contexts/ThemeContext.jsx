import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // 1. Initialize state from localStorage or default to 'system'
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('4flow-theme-preference') || 'system';
  });

  // 2. State for the actual effective theme (light/dark)
  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // 3. Effect to resolve the effective theme based on preference and system settings
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (newTheme) => {
      setEffectiveTheme(newTheme);
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Initial check
      applyTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listener for system changes
      const handleChange = (e) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Manual 'light' or 'dark'
      applyTheme(themePreference);
    }
  }, [themePreference]);

  // 4. Persist preference whenever it changes
  useEffect(() => {
    localStorage.setItem('4flow-theme-preference', themePreference);
  }, [themePreference]);

  const toggleTheme = () => {
    setThemePreference(prev => {
      if (prev === 'system') {
        return effectiveTheme === 'light' ? 'dark' : 'light';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  const setThemeMode = (mode) => {
    setThemePreference(mode); // 'light', 'dark', or 'system'
  };

  const value = {
    theme: themePreference, // Return the preference so Settings UI knows selected option
    effectiveTheme,         // actual resolved theme
    toggleTheme,
    setThemeMode,
    isDark: effectiveTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
