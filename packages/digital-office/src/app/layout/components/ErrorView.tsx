import * as React from 'react';
import { HttpClientError } from '@digital-net-org/digital-api-sdk';
import { Button, Stack, Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { DnView } from '../../../ui';

export interface ErrorViewProps {
    statusCode?: number | string;
    title?: string;
    description?: string;
    error?: unknown;
    children?: React.ReactNode;
}

export function ErrorView({
    statusCode,
    title = 'Erreur',
    description = 'Une erreur est survenue.',
    error,
    children,
}: ErrorViewProps) {
    const navigate = useNavigate();

    const resolvedCode = statusCode ?? (error instanceof HttpClientError ? error.status : 'ERROR');

    const payload =
        error instanceof Error
            ? {
                  name: error.name,
                  message: error.message,
                  ...(error instanceof HttpClientError ? { status: error.status, data: error.data } : {}),
              }
            : error;

    return (
        <DnView title={title} description={description}>
            <Center>
                <BigCode>{resolvedCode}</BigCode>
                {error !== undefined && <Pre>{JSON.stringify(payload, null, 2)}</Pre>}
                {children ?? (
                    <Button variant="contained" onClick={() => navigate('/')}>
                        Retour à l&apos;accueil
                    </Button>
                )}
            </Center>
        </DnView>
    );
}

const Center = styled(Stack)(
    () => css`
        flex: 1;
        align-items: center;
        justify-content: center;
        gap: 2rem;
    `
);

const BigCode = styled(Typography)(
    () => css`
        font-size: 8rem;
        font-weight: 700;
        line-height: 1;
    `
);

const Pre = styled('pre')(
    ({ theme }) => css`
        max-width: 80%;
        max-height: 40vh;
        overflow: auto;
        padding: 1rem;
        background-color: ${theme.palette.action.hover};
        border-radius: ${theme.shape.borderRadius}px;
        font-size: 0.85rem;
        margin: 0;
    `
);
