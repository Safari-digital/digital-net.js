import * as React from 'react';
import type { SxProps, Theme } from '@mui/material';
import { EditorFrame } from '../EditorFrame';

interface LexicalRootProps {
    children: React.ReactNode;
    disabled?: boolean;
    error?: boolean;
    sx?: SxProps<Theme>;
}

export function LexicalRoot({ children, disabled, error, sx }: LexicalRootProps) {
    return (
        <EditorFrame
            data-disabled={disabled || undefined}
            aria-disabled={disabled || undefined}
            data-error={error || undefined}
            sx={[
                {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    height: 'auto',
                    '& strong, & .bold': { fontWeight: 700 },
                    '& em, & .italic': { fontStyle: 'italic' },
                    '& u, & .underline': { textDecoration: 'underline' },
                    '& s, & .strikethrough': { textDecoration: 'line-through' },
                    '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'divider',
                        pl: 2,
                        ml: 0,
                        fontStyle: 'italic',
                    },
                    '& h1, & .title-1': { fontSize: '1.75rem', my: 1.5, fontWeight: 600 },
                    '& h2, & .title-2': { fontSize: '1.5rem', my: 1.25, fontWeight: 600 },
                    '& h3, & .title-3': { fontSize: '1.25rem', my: 1, fontWeight: 600 },
                    '& h4, & .title-4': { fontSize: '1.1rem', my: 0.75, fontWeight: 600 },
                    '& ul, & ol, & .list, & .list-numbered': { pl: 4, my: 1 },
                    '& p, & .paragraph': { my: 0.5 },
                    '& a, & .link': { color: 'primary.main', textDecoration: 'underline' },
                    '& img': { maxWidth: '100%', height: 'auto' },
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
        </EditorFrame>
    );
}
