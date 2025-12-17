import type { DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
    colors: {
        background: '#ffffff',
        surface: '#f3f4f6', // gray-100
        border: '#e5e7eb', // gray-200
        text: '#111827', // gray-900
        textSecondary: '#4b5563', // gray-600
        primary: '#2563eb', // blue-600
        primaryHover: '#1d4ed8', // blue-700
        danger: '#ef4444', // red-500
        success: '#10b981', // green-500
    },
};

export const darkTheme: DefaultTheme = {
    colors: {
        background: '#0f172a', // slate-900
        surface: '#1e293b', // slate-800
        border: '#334155', // slate-700
        text: '#f8fafc', // slate-50
        textSecondary: '#94a3b8', // slate-400
        primary: '#3b82f6', // blue-500
        primaryHover: '#60a5fa', // blue-400
        danger: '#f87171', // red-400
        success: '#34d399', // green-400
    },
};
