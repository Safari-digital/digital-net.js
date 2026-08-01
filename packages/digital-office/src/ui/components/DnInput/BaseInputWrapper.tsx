import * as React from 'react';
import { css, styled } from '@mui/material/styles';

export function BaseInputWrapper({ children }: React.PropsWithChildren) {
    return <InputWrapper>{children}</InputWrapper>;
}

const InputWrapper = styled('div')(
    () => css`
        position: relative;
        width: 100%;
    `
);
