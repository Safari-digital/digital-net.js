import { Close as CloseIcon } from '@mui/icons-material';
import { Dialog, Divider, Stack, useTheme } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { DnIconButton, type DnTab, DnTabs } from '../../ui';
import { SettingsApplication } from './SettingsApplication';
import { SettingsMyAccount } from './SettingsMyAccount';
import { useDnLayout } from './useDnLayout';

const SETTINGS_TABS: DnTab[] = [
    { key: 'myaccount', label: 'Mon compte', content: <SettingsMyAccount /> },
    { key: 'app', label: 'Application', content: <SettingsApplication />, disabled: true },
];

export function Settings() {
    const theme = useTheme();
    const { isUserSettingsOpen, setIsUserSettingsOpen } = useDnLayout();
    const handleClose = () => setIsUserSettingsOpen(false);

    return (
        <Dialog
            open={isUserSettingsOpen}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper:
                    theme.palette.mode === 'dark'
                        ? {
                              elevation: 2,
                              sx: t => ({
                                  backgroundColor: t.palette.background.default,
                              }),
                          }
                        : {},
            }}
        >
            <DnIconButton
                onClick={handleClose}
                sx={theme => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </DnIconButton>
            <DialogContent sx={{ overflowX: 'hidden' }}>
                <DnTabs items={SETTINGS_TABS} divider />
            </DialogContent>
        </Dialog>
    );
}

const DialogContent = styled(Stack)(
    ({ theme }) => css`
        height: 100vh;
        padding: ${theme.spacing(0.5)} ${theme.spacing(2)};
    `
);
