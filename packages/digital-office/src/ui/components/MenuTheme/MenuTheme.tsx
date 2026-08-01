import * as React from 'react';
import { DarkMode as DarkIcon, LightMode as LightIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { ThemePreference } from '../../theme';
import { DnIconButton } from '../DnIconButton';

export function MenuTheme() {
    const theme = useTheme();
    const resolvedThemeIcon = React.useMemo(
        () => ({ light: <DarkIcon />, dark: <LightIcon /> })[theme.palette.mode],
        [theme.palette.mode]
    );

    if (!resolvedThemeIcon) {
        return null;
    }

    return <DnIconButton onClick={ThemePreference.toggleTheme}>{resolvedThemeIcon}</DnIconButton>;
}
