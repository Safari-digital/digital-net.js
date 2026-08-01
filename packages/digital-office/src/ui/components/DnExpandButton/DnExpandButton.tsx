import * as React from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { DnIconButton } from '../DnIconButton';

export interface DnExpandButtonProps {
    onClick: () => void;
    disabled?: boolean;
    expanded?: boolean;
}

export function DnExpandButton({ expanded, ...dnIconButtonProps }: DnExpandButtonProps) {
    return (
        <DnIconButton {...dnIconButtonProps}>
            <ExpandMoreIcon
                sx={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                }}
            />
        </DnIconButton>
    );
}
