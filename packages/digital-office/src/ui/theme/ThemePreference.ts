import type { PaletteMode } from '@mui/material/styles';
import { THEME_BODY_ATTR, THEME_LS_KEY } from './const';

export class ThemePreference {
    static #themes = ['light', 'dark'] as const;

    /**
     * Retrieves the user's theme preference from localStorage.
     */
    public static getThemeFromLS = (): PaletteMode | undefined => {
        const result = (localStorage.getItem(THEME_LS_KEY) as PaletteMode) ?? undefined;
        if (result === undefined || ThemePreference.#themes.includes(result)) {
            return result;
        }
        console.warn(
            `ThemePreference: Invalid theme value in localStorage: ${result}. Expected 'light' or 'dark'. Resetting to undefined.`
        );
        localStorage.removeItem(THEME_LS_KEY);
        return undefined;
    };

    /**
     * Retrieves the current theme from the body element's data attribute.
     */
    public static getThemeFromBody = (): PaletteMode | undefined => {
        const result = (document.body.getAttribute(THEME_BODY_ATTR) as PaletteMode) ?? undefined;
        if (result === undefined || ThemePreference.#themes.includes(result)) {
            return result;
        }
        console.warn(
            `ThemePreference: Invalid theme value in body attribute: ${result}. Expected 'light' or 'dark'. Resetting to undefined.`
        );
        document.body.removeAttribute(THEME_BODY_ATTR);
        return undefined;
    };

    /**
     * Determines the user's system theme preference using the `prefers-color-scheme` media query.
     */
    public static getThemeFromSystem = (): PaletteMode =>
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    /**
     * Resolves the current theme by checking localStorage or system preferences. Sets the theme as a data attribute
     * `data-theme` on the body element for global access.
     *
     * If a theme is found in localStorage, it will be used. If not, the system preference will be determined and
     * stored in localStorage for future use.
     */
    public static resolveTheme = () => {
        let theme = ThemePreference.getThemeFromLS();
        if (!theme) {
            theme = ThemePreference.getThemeFromSystem();
            localStorage.setItem(THEME_LS_KEY, theme);
        }
        document.body.setAttribute(THEME_BODY_ATTR, theme);
    };

    /**
     * Sets the theme by updating localStorage and the body element's data attribute.
     * @param theme
     */
    public static setTheme = (theme: PaletteMode) => {
        localStorage.setItem(THEME_LS_KEY, theme);
        document.body.setAttribute(THEME_BODY_ATTR, theme);
    };

    /**
     * Toggles the theme between 'light' and 'dark'.
     */
    public static toggleTheme = () => {
        const currentTheme =
            ThemePreference.getThemeFromLS() ??
            ThemePreference.getThemeFromBody() ??
            ThemePreference.getThemeFromSystem();
        ThemePreference.setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    };
}
