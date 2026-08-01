import * as React from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, Stack, type StackProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CollapsibleBlockProps extends StackProps {
    label?: React.ReactNode;
    children?: React.ReactNode;
    /** Persist open/closed state in localStorage under this key. */
    storageKey?: string;
    /** Initial state used when no persisted value is found. Defaults to false (closed). */
    defaultOpen?: boolean;
}

function readStored(key: string | undefined, fallback: boolean): boolean {
    if (!key || typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : raw === 'true';
    } catch {
        return fallback;
    }
}

function writeStored(key: string | undefined, value: boolean) {
    if (!key || typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, String(value));
    } catch {
        /* noop */
    }
}

export function CollapsibleBlock({
    children,
    label,
    storageKey,
    defaultOpen = false,
    ...stackProps
}: CollapsibleBlockProps) {
    const [open, setOpen] = React.useState<boolean>(() => readStored(storageKey, defaultOpen));

    const toggle = React.useCallback(() => {
        setOpen(prev => {
            const next = !prev;
            writeStored(storageKey, next);
            return next;
        });
    }, [storageKey]);

    return (
        <Stack {...stackProps}>
            <Stack
                component="button"
                onClick={toggle}
                sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                }}
            >
                {label}
                <ExpandMore expand={open} />
            </Stack>
            <Collapse in={open} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </Stack>
    );
}

const ExpandMore = styled(ExpandMoreIcon, { shouldForwardProp: prop => prop !== 'expand' })<{ expand: boolean }>(
    ({ theme, expand }) => ({
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        }),
        transform: expand ? 'rotate(180deg)' : 'rotate(0deg)',
    })
);
