import * as React from 'react';
import { Box, type BoxProps } from '@mui/material';
import { css, styled } from '@mui/material/styles';

export function EditorFrame(props: BoxProps) {
    return <StyledFrame {...props} />;
}

const StyledFrame = styled(Box)(
    ({ theme }) => css`
        position: relative;
        border: 1px solid ${theme.palette.divider};
        border-radius: ${theme.shape.borderRadius};
        overflow: hidden;
        transition: border-color 0.2s ease-in-out;
        height: 100%;
        width: 100%;

        &:focus-within {
            border-color: ${theme.palette.primary.main};
        }

        &[data-disabled] {
            opacity: 0.35;
            pointer-events: none;
            cursor: not-allowed;
            border-color: ${theme.palette.action.disabled};
        }

        &[data-error] {
            border-color: ${theme.palette.error.main};
        }
    `
);
