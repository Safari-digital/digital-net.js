import * as React from 'react';
import { Badge, IconButton, type IconButtonProps, Tooltip, type TooltipProps } from '@mui/material';

export interface DnIconButtonProps extends Pick<
    IconButtonProps,
    'onClick' | 'type' | 'sx' | 'className' | 'id' | 'color' | 'size'
> {
    children: React.ReactNode;
    tooltip?: string;
    tooltipPlacement?: TooltipProps['placement'];
    counter?: number;
    disabled?: boolean;
    disableRipple?: boolean;
}

export const DnIconButton = React.forwardRef<HTMLButtonElement, DnIconButtonProps>(function DnIconButton(
    {
        children,
        tooltip,
        tooltipPlacement = 'bottom-start',
        counter,
        disabled,
        disableRipple,
        color = 'inherit',
        size = 'small',
        ...rest
    },
    ref
) {
    const content =
        counter !== undefined ? (
            <Badge badgeContent={counter} color="primary">
                {children}
            </Badge>
        ) : (
            children
        );

    const button = (
        <IconButton ref={ref} disabled={disabled} disableRipple={disableRipple} color={color} size={size} {...rest}>
            {content}
        </IconButton>
    );

    if (!tooltip) return button;

    return (
        <Tooltip title={disabled ? '' : tooltip} placement={tooltipPlacement}>
            <span>{button}</span>
        </Tooltip>
    );
});
