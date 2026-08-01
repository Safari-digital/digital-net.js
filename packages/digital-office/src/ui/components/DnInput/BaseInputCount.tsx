import * as React from 'react';
import { Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { basePaddingY } from './BaseInput';

export interface BaseInputCountProps {
    value: number | null | undefined;
    max: number | null | undefined;
}

export function BaseInputCount({ value, max }: BaseInputCountProps) {
    return max ? (
        <Count>
            {value}/{max}
        </Count>
    ) : null;
}

const Count = styled(Typography)(
    ({ theme }) => css`
        position: absolute;
        top: -0.75rem;
        right: ${basePaddingY}rem;
        z-index: 1;
        font-size: 0.7rem;
        line-height: 1;
        color: ${theme.palette.text.secondary};
        pointer-events: none;
        user-select: none;
    `
);
