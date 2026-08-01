import * as React from 'react';
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { AppBar as MuiAppBar, Stack } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import type { BreadcrumbsProps } from '../Breadcrumbs';
import { Breadcrumbs } from '../Breadcrumbs';
import { DnIconButton } from '../DnIconButton';
import { MenuAccount, type MenuAccountProps } from '../MenuAccount';
import { MenuSettings, type MenuSettingsProps } from '../MenuSettings';
import { MenuTheme } from '../MenuTheme';

export interface AppBarProps {
    slots: {
        account: MenuAccountProps;
        settings: MenuSettingsProps;
        menu: { open?: boolean; onClick?: () => void };
        breadcrumbs?: BreadcrumbsProps;
    };
    disableSlots?: Partial<Record<'account' | 'settings' | 'theme' | 'menu' | 'breadcrumb', boolean>>;
}

export function AppBar({ slots, disableSlots }: AppBarProps) {
    return (
        <CustomAppBar disableMenu={disableSlots?.menu} elevation={0}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                {disableSlots?.menu ? null : (
                    <DnIconButton onClick={slots?.menu?.onClick}>
                        {slots?.menu?.open ? <MenuOpenIcon /> : <MenuIcon />}
                    </DnIconButton>
                )}
                {disableSlots?.breadcrumb ? null : <Breadcrumbs {...(slots?.breadcrumbs ?? {})} />}
            </Stack>
            <Stack direction="row" sx={{ gap: 0.5 }}>
                {disableSlots?.account ? null : <MenuAccount {...slots.account} />}
                {disableSlots?.theme ? null : <MenuTheme />}
                {disableSlots?.settings ? null : <MenuSettings {...slots.settings} />}
            </Stack>
        </CustomAppBar>
    );
}

const CustomAppBar = styled(MuiAppBar, {
    shouldForwardProp: prop => prop !== 'disableMenu',
})<{ disableMenu?: boolean }>(
    ({ theme, disableMenu }) => css`
        position: relative;
        height: 2.5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: ${disableMenu ? '0 0.5rem 0 1.25rem' : '0 0.5rem'};
        color: ${theme.palette.text.primary};
        background-color: ${theme.palette.background.default};
        box-shadow: none;
    `
);
