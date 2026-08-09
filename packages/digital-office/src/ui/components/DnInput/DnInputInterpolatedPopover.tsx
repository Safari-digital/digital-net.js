import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { ClickAwayListener, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { getVirtualAnchor } from './utils';
import { buildAvailableVariables } from './utils/interpolated';

export interface DnInputInterpolatedPopoverProps {
    anchorPosition: { top: number; left: number } | null;
    query: string;
    variables: TemplateVariable[];
    onSelect: (_token: string) => void;
    onClose: () => void;
}

export function DnInputInterpolatedPopover({
    anchorPosition,
    query,
    variables,
    onSelect,
    onClose,
}: DnInputInterpolatedPopoverProps) {
    const filtered = React.useMemo(() => buildAvailableVariables(variables, query), [variables, query]);
    const isOpen = anchorPosition !== null && filtered.length > 0;

    if (!isOpen || !anchorPosition) return null;
    return (
        <PopoverList
            key={`${query}|${variables.length}`}
            anchorPosition={anchorPosition}
            filtered={filtered}
            onSelect={onSelect}
            onClose={onClose}
        />
    );
}

interface PopoverListProps extends Omit<DnInputInterpolatedPopoverProps, 'query' | 'variables'> {
    filtered: TemplateVariable[];
}

function PopoverList({ anchorPosition, filtered, onSelect, onClose }: PopoverListProps) {
    if (!anchorPosition) throw new Error('No anchorPosition provided');

    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const listRef = React.useRef<HTMLUListElement | null>(null);
    const anchor = getVirtualAnchor(anchorPosition);

    const handleSelect = React.useCallback(
        (index: number) => {
            const target = filtered[index];
            if (target) onSelect(target.token);
        },
        [filtered, onSelect]
    );

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlightedIndex(i => (i + 1) % filtered.length);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlightedIndex(i => (i - 1 + filtered.length) % filtered.length);
            } else if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                handleSelect(highlightedIndex);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        // capture phase to take precedence over textarea/input default behavior
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [filtered.length, highlightedIndex, handleSelect, onClose]);

    return (
        <Popper open anchorEl={anchor} placement="bottom-start" style={{ zIndex: 1500 }}>
            <ClickAwayListener onClickAway={onClose}>
                <StyledPaper>
                    <MenuList ref={listRef} dense disablePadding>
                        {filtered.map((descriptor, index) => (
                            <MenuItem
                                key={descriptor.token}
                                selected={index === highlightedIndex}
                                onMouseDown={event => {
                                    event.preventDefault();
                                    handleSelect(index);
                                }}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <Stack>
                                    <Typography variant="body2" component="span">
                                        {descriptor.token}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" component="span">
                                        {descriptor.source}.{descriptor.field}
                                    </Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </MenuList>
                </StyledPaper>
            </ClickAwayListener>
        </Popper>
    );
}

const StyledPaper = styled(Paper)(
    () => css`
        max-height: 16rem;
        overflow-y: auto;
        min-width: 16rem;
        margin-top: 0.25rem;
    `
);

const Stack = styled('span')(
    () => css`
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    `
);
