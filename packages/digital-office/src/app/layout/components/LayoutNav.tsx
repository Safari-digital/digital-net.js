import * as React from 'react';
import { MenuItem as MuiMenuItem, MenuList as MuiMenuList, Stack, Typography, alpha } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { matchPath, useLocation, useNavigate } from 'react-router';
import type { NavSection } from '../../../router/buildNavSections';
import { CollapsibleBlock } from '../../../ui/components/CollapsibleBlock';

export interface LayoutNavProps {
    navigation: NavSection[];
    children?: React.ReactNode;
}

export function LayoutNav({ navigation }: LayoutNavProps) {
    const location = useLocation();
    const navigate = useNavigate();

    // Segment-aware prefix match: an entry stays highlighted on its subpages
    // without over-matching sibling paths sharing a raw prefix.
    const isCurrent = React.useCallback(
        (path: string) => matchPath({ path, end: path === '/' }, location.pathname) !== null,
        [location.pathname]
    );
    const isExact = React.useCallback(
        (path: string) => matchPath(path, location.pathname) !== null,
        [location.pathname]
    );

    return (
        <Container>
            {navigation.map(section => (
                <CollapsibleBlock
                    key={section.id}
                    label={<MenuLabel>{section.label}</MenuLabel>}
                    storageKey={`DN_NAV_GROUP_${section.id}`}
                >
                    <MenuList>
                        {section.items.map(({ label, path }) => {
                            const current = isCurrent(path);
                            const exact = isExact(path);
                            return (
                                <MenuItem
                                    key={path}
                                    selected={current}
                                    disableRipple={exact}
                                    disableTouchRipple={exact}
                                    sx={
                                        current && !exact
                                            ? { '&.Mui-selected, &.Mui-selected:hover': { cursor: 'pointer' } }
                                            : undefined
                                    }
                                    onClick={() => (!exact ? navigate(path) : void 0)}
                                >
                                    {label}
                                </MenuItem>
                            );
                        })}
                    </MenuList>
                </CollapsibleBlock>
            ))}
        </Container>
    );
}

const Container = styled(Stack)(
    () => css`
        width: 100%;
        padding: 0.25rem 0.5rem 0;
    `
);

const MenuLabel = styled(Typography)(
    () => css`
        padding: 0.5rem 0.1rem 0;
        letter-spacing: 0.025rem;
        font-weight: 500;
        font-size: 0.9rem;
        text-transform: uppercase;
        text-wrap: nowrap;
        user-select: none;
    `
);

const MenuList = styled(MuiMenuList)(
    () => css`
        padding: 0;
    `
);

const MenuItem = styled(MuiMenuItem)(
    ({ theme }) => css`
        margin: 0.25rem 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: ${theme.shape.borderRadius};
        font-size: 0.9rem;
        &.Mui-selected,
        &.Mui-selected:hover {
            cursor: default;
            font-weight: 500;
            font-style: italic;
            background-color: ${alpha(theme.palette.primary.main, 0.15)};
        }
    `
);
