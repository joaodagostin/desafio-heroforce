import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const THEME_KEY = 'heroforce.theme';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#101a16' : '#f7f8fa');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The theme still works for this visit when browser storage is unavailable.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle({
  className = '',
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeToggle precisa estar dentro de ThemeProvider.');
  const dark = context.theme === 'dark';
  const label = dark ? 'Ativar tema claro' : 'Ativar tema escuro';
  return (
    <button
      type="button"
      className={`icon-button theme-toggle ${className}`}
      onClick={context.toggle}
      title={label}
      aria-label={label}
      aria-pressed={dark}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
      {showLabel && <span>{dark ? 'Tema claro' : 'Tema escuro'}</span>}
    </button>
  );
}
