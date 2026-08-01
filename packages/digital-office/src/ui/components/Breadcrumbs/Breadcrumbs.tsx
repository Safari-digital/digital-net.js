import * as React from 'react';
import { Home as HomeIcon } from '@mui/icons-material';
import { IconButton, Link, Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';

export interface BreadcrumbEntry {
    key: string;
    path: string;
}

export interface BreadcrumbsProps {
    url?: string;
    labels?: Record<string, string>;
    onClick?: (_path: string) => void;
    onHomeClick?: () => void;
    isPathClickable?: (_path: string) => boolean;
}

function parseBreadcrumbs(url: string): BreadcrumbEntry[] {
    const slugs = url.split('/').filter(Boolean);
    return slugs.map((slug, i) => ({
        key: slug,
        path: '/' + slugs.slice(0, i + 1).join('/'),
    }));
}

export function Breadcrumbs({ url, labels, onClick, onHomeClick, isPathClickable }: BreadcrumbsProps) {
    const entries = React.useMemo(() => parseBreadcrumbs(url ?? ''), [url]);

    return (
        <CustomBreadCrumbs className="Breadcrumbs">
            <IconButton size="small" color="inherit" onClick={onHomeClick}>
                <HomeIcon fontSize="small" />
            </IconButton>
            {entries.map((entry, i) => {
                const label = labels?.[entry.key] ?? entry.key;
                if (i === entries.length - 1) {
                    return (
                        <Typography key={entry.path} sx={{ fontWeight: 'bold' }}>
                            {label}
                        </Typography>
                    );
                }
                return (isPathClickable?.(entry.path) ?? true) ? (
                    <Link key={entry.path} onClick={() => onClick?.(entry.path)}>
                        {label}
                    </Link>
                ) : (
                    <Typography key={entry.path}>{label}</Typography>
                );
            })}
        </CustomBreadCrumbs>
    );
}

const CustomBreadCrumbs = styled(MuiBreadcrumbs)(
    () => css`
        font-weight: normal;
        letter-spacing: 0.035rem;
        user-select: none;

        & .MuiLink-root {
            text-decoration: underline;
            cursor: pointer;
            color: inherit;
        }
    `
);
