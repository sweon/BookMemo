import type { DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
    mode: 'light',
    fontSize: 16,
    colors: {
        background: '#f0f2f5', // Slightly darker/warmer gray for less brightness
        surface: '#ffffff',
        border: '#d1d5db', // gray-300
        text: '#111827', // gray-900
        textSecondary: '#4b5563', // gray-600
        primary: '#3b82f6', // blue-500
        primaryHover: '#2563eb', // blue-600
        danger: '#ef4444', // red-500
        success: '#10b981', // green-500
    },
};

export const darkTheme: DefaultTheme = {
    mode: 'dark',
    fontSize: 16,
    colors: {
        background: '#2b2d31', // Much lighter charcoal gray
        surface: '#383a40', // Distinctly lighter surface
        border: '#4b4d52',
        text: '#e8eaed',
        textSecondary: '#aab0b6',
        primary: '#60a5fa', // lighter blue
        primaryHover: '#3b82f6',
        danger: '#f87171',
        success: '#34d399',
    },
};
