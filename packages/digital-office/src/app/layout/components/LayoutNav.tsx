import * as React from 'react';
import { MenuItem as MuiMenuItem, MenuList as MuiMenuList, Stack, Typography, alpha } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router';
import { CollapsibleBlock } from '../../../ui/components/CollapsibleBlock';

export interface LayoutNavProps {
    navigation: Record<string, Array<{ label: string; path: string }>>;
    children?: React.ReactNode;
}

export function LayoutNav({ navigation }: LayoutNavProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const checkIsCurrent = React.useCallback((path: string) => location.pathname.includes(path), [location]);

    return (
        <Container>
            {Object.entries(navigation).map(([key, items]) => (
                <CollapsibleBlock key={key} label={<MenuLabel>{key}</MenuLabel>} storageKey={`DN_NAV_GROUP_${key}`}>
                    <MenuList>
                        {items.map(({ label, path }) => {
                            const current = checkIsCurrent(path);
                            return (
                                <MenuItem
                                    key={path}
                                    selected={current}
                                    disableRipple={current}
                                    disableTouchRipple={current}
                                    onClick={() => (!current ? navigate(path) : void 0)}
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
