import * as React from 'react';
import { Drawer as MuiDrawer } from '@mui/material';
import { css, styled } from '@mui/material/styles';

export interface AppDrawerProps extends React.PropsWithChildren {
    open?: boolean;
}

export function AppDrawer({ open, children }: AppDrawerProps) {
    return (
        <Drawer open={open} variant="persistent">
            {children}
        </Drawer>
    );
}

const drawerTransition = '225ms ease-in-out';
const drawerWidth = '300px';

const Drawer = styled(MuiDrawer)(
    ({ open, theme }) => css`
        &.MuiDrawer-root {
            width: ${open ? drawerWidth : '0px'};
            transform: none;
            transition: ${drawerTransition} !important;
        }
        & .MuiPaper-root {
            width: ${open ? drawerWidth : '0px'};
            transform: none;
            transition: ${drawerTransition} !important;

            border: none;
            background-color: ${theme.palette.background.default};
        }
    `
);
