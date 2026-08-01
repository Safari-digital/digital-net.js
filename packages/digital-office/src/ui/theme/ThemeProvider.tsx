import * as React from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { ThemePreference } from './ThemePreference';
import { darkTheme, lightTheme } from './config';
import { THEME_BODY_ATTR } from './const';

/**
 * Syncs MUI theme based on system preferences.
 *
 * MUI Theme is synced with the data-theme attribute on the body element, which is set based on:
 * 1. LocalStorage value (if user has previously selected a theme)
 * 2. System preference (if no stored preference exists)
 * 3. Defaults to light theme if system preference cannot be determined
 * @param children - React children to render within the theme provider.
 */
export const ThemeProvider = ({ children }: React.PropsWithChildren) => {
    const [mode, setMode] = React.useState<'light' | 'dark'>(() => {
        ThemePreference.resolveTheme();
        const bodyTheme = ThemePreference.getThemeFromBody();
        return bodyTheme === 'dark' ? 'dark' : 'light';
    });
    const activeTheme = React.useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

    const syncMuiTheme = React.useCallback(() => {
        const bodyTheme = ThemePreference.getThemeFromBody();
        if (bodyTheme === 'dark' || bodyTheme === 'light') {
            setMode(bodyTheme);
        }
    }, []);

    React.useEffect(() => {
        const observer = new MutationObserver(mutations => {
            if (mutations.some(mutation => mutation.attributeName === THEME_BODY_ATTR)) {
                syncMuiTheme();
            }
        });
        observer.observe(document.body, { attributes: true });

        return () => observer.disconnect();
    }, [syncMuiTheme]);

    return (
        <MuiThemeProvider theme={activeTheme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
};
