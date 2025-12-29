'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // Always enforce dark mode
    useEffect(() => {
        setMounted(true);
        // Force state to dark just in case
        setThemeState('dark');
    }, []);

    // Apply dark class to document
    useEffect(() => {
        if (!mounted || typeof window === 'undefined') return;

        const root = document.documentElement;
        // Always add dark, remove light
        root.classList.add('dark');
        root.classList.remove('light');

        // Update meta theme-color for dark mode
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#0f172a');
        }
    }, [mounted]);

    const toggleTheme = () => {
        // Disabled: Always stay in dark mode
        console.log("Theme toggle is disabled. Enforcing Dark Mode.");
    };

    const setTheme = (newTheme: Theme) => {
        // Disabled: Always stay in dark mode
    };

    return (
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
