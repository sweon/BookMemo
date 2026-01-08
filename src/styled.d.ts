import 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        mode: 'light' | 'dark';
        fontSize: number;
        themeName: string;
        colors: {
            background: string;
            surface: string;
            border: string;
            text: string;
            textSecondary: string;
            primary: string;
            primaryHover: string;
            danger: string;
            success: string;
        };
    }
}
