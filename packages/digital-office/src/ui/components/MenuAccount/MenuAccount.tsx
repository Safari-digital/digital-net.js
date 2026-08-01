import * as React from 'react';
import { AccountCircle as AccountIcon, Logout as LogoutIcon, Person as PersonIcon } from '@mui/icons-material';
import {
    Box,
    CircularProgress,
    ListItemIcon,
    ListItemText,
    MenuItem,
    MenuList,
    Stack,
    Typography,
} from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { AppBarMenu } from '../AppBarMenu';
import { DnIconButton } from '../DnIconButton';

export interface MenuAccountProps {
    username: string | undefined;
    isAdmin: boolean | undefined;
    imgSrc: string | undefined;
    disabled?: boolean;
    loading?: boolean;
    onMyAccountClick: () => void;
    onLogoutClick: () => void;
}

export function MenuAccount({
    imgSrc: _imgSrc,
    username,
    isAdmin,
    loading,
    onMyAccountClick,
    onLogoutClick,
    ...IconButtonProps
}: MenuAccountProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleMyAccountClick = () => {
        onMyAccountClick();
        setAnchorEl(null);
    };

    return (
        <React.Fragment>
            <DnIconButton {...IconButtonProps} onClick={handleClick}>
                <AccountIcon />
            </DnIconButton>
            <AppBarMenu anchorEl={anchorEl} onClose={handleClose}>
                <UsernameBox isAdmin={isAdmin}>
                    {loading ? <CircularProgress size={18} /> : <Box sx={{ width: 18 }} />}
                    <Typography sx={{ fontWeight: 'medium' }}>
                        <AdminBox>{isAdmin ? '(Administrateur)' : ''}</AdminBox>
                        {username ?? ''}
                    </Typography>
                </UsernameBox>
                <MenuList>
                    <MenuItem disabled={loading} onClick={handleMyAccountClick}>
                        <ListItemIcon>
                            <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Mon compte</ListItemText>
                    </MenuItem>
                    <MenuItem disabled={loading} onClick={onLogoutClick}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Déconnexion</ListItemText>
                    </MenuItem>
                </MenuList>
            </AppBarMenu>
        </React.Fragment>
    );
}

const UsernameBox = styled(Stack, {
    shouldForwardProp: prop => prop !== 'isAdmin',
})<{ isAdmin: boolean | undefined }>(
    ({ theme, isAdmin }) => css`
        position: relative;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0 1rem ${isAdmin ? '1.25rem' : '0.5rem'};
        border-bottom: 1px solid ${theme.palette.divider};
        user-select: none;
    `
);

const AdminBox = styled('span')(
    ({ theme }) => css`
        position: absolute;
        top: 1.25rem;
        right: 0.6rem;
        display: inline-block;
        font-size: 0.8rem;
        color: ${theme.palette.primary.main};
        margin-right: 0.35rem;
    `
);
