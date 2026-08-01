import { type ThemeOptions, createTheme } from '@mui/material/styles';
import { components } from './components';
import { darkPalette, lightPalette } from './palette';
import { shape } from './shape';
import { typography } from './typography';

function buildThemeOptions(mode: 'light' | 'dark'): ThemeOptions {
    if (mode !== 'light' && mode !== 'dark') {
        throw new Error(`Invalid theme mode: ${mode}`);
    }

    return {
        palette: mode === 'light' ? lightPalette : darkPalette,
        components,
        typography,
        ...shape,
    };
}

export const lightTheme = createTheme(buildThemeOptions('light'));
export const darkTheme = createTheme(buildThemeOptions('dark'));
