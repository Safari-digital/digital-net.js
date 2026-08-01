import * as React from 'react';
import type { JSX } from 'react';
import { Menu, type MenuProps } from '@mui/material';

export interface AppBarMenuProps {
    anchorEl: MenuProps['anchorEl'];
    onClose?: () => void;
    children?: React.ReactNode;
}

export function AppBarMenu({ anchorEl, onClose, children }: AppBarMenuProps): JSX.Element {
    return (
        <Menu
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            onClose={onClose}
            slotProps={{
                paper: {
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.32))',
                        mt: 0.5,
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                },
            }}
        >
            {children}
        </Menu>
    );
}
