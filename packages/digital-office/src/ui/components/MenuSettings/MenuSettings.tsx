import * as React from 'react';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { DnIconButton } from '../DnIconButton';

export interface MenuSettingsProps {
    onClick: () => void;
}

export function MenuSettings({ onClick }: MenuSettingsProps) {
    return (
        <DnIconButton>
            <SettingsIcon onClick={onClick} />
        </DnIconButton>
    );
}
