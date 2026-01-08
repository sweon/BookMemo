import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import { themePresets } from '../theme';
import { GlobalStyle } from '../GlobalStyle';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    fontSize: number;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    theme: DefaultTheme;
    setThemeByName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [themeName, setThemeName] = useState<string>(() => {
        return localStorage.getItem('themeName') || 'Classic';
    });

    const [lastLightTheme, setLastLightTheme] = useState<string>(() => {
        return localStorage.getItem('lastLightTheme') || 'Classic';
    });

    const [lastDarkTheme, setLastDarkTheme] = useState<string>(() => {
        return localStorage.getItem('lastDarkTheme') || 'Dark';
    });

    const [mode, setMode] = useState<ThemeMode>(() => {
        // Default to light (Classic) if not set
        const saved = localStorage.getItem('theme');
        if (!saved && !localStorage.getItem('themeName')) return 'light';
        return (saved as ThemeMode) || (themePresets[themeName]?.mode) || 'light';
    });

    const [fontSize, setFontSize] = useState<number>(() => {
        const saved = localStorage.getItem('fontSize');
        return saved ? Number(saved) : 16;
    });

    useEffect(() => {
        localStorage.setItem('theme', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('themeName', themeName);
        const preset = themePresets[themeName];
        if (preset) {
            if (preset.mode === 'light') {
                setLastLightTheme(themeName);
                localStorage.setItem('lastLightTheme', themeName);
            } else {
                setLastDarkTheme(themeName);
                localStorage.setItem('lastDarkTheme', themeName);
            }
        }
    }, [themeName]);

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize.toString());
    }, [fontSize]);

    const toggleTheme = () => {
        if (mode === 'light') {
            setMode('dark');
            setThemeName(lastDarkTheme);
        } else {
            setMode('light');
            setThemeName(lastLightTheme);
        }
    };

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 1, 24));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 1, 12));
    };

    const setThemeByName = (name: string) => {
        setThemeName(name);
        const preset = themePresets[name];
        if (preset) {
            setMode(preset.mode);
        }
    };

    const currentTheme: DefaultTheme = {
        mode,
        fontSize,
        themeName,
        colors: themePresets[themeName] || themePresets.Classic,
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, fontSize, increaseFontSize, decreaseFontSize, theme: currentTheme, setThemeByName }}>
            <StyledThemeProvider theme={currentTheme}>
                <GlobalStyle />
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
};
