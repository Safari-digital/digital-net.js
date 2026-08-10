import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { DnInput, type DnInputProps } from './DnInput';
import { DnInputInterpolatedPopover } from './DnInputInterpolatedPopover';
import { buildTemplateContext, validateInterpolatedString } from './utils/interpolated';

export interface DnInputInterpolatedProps extends DnInputProps {
    variables: TemplateVariable[];
}

export function DnInputInterpolated({
    variables,
    onChange,
    value,
    helperText,
    error,
    ...rest
}: DnInputInterpolatedProps) {
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [anchor, setAnchor] = React.useState<{ top: number; left: number } | null>(null);
    const [query, setQuery] = React.useState('');
    const [context, setContext] = React.useState<{ start: number; insideChain: boolean } | null>(null);

    const effectiveValue = typeof value === 'string' ? value : '';

    const invalidPlaceholders = React.useMemo(
        () => validateInterpolatedString(effectiveValue, variables),
        [effectiveValue, variables]
    );

    const closePopover = React.useCallback(() => {
        setAnchor(null);
        setContext(null);
        setQuery('');
    }, []);

    const refreshContext = React.useCallback(() => {
        if (variables.length === 0) {
            closePopover();
            return;
        }
        const node = inputRef.current;
        if (!node) return;
        const caret = node.selectionStart ?? 0;
        const ctx = buildTemplateContext(node.value, caret);
        if (!ctx) {
            closePopover();
            return;
        }
        const rect = node.getBoundingClientRect();
        setAnchor({ top: rect.bottom, left: rect.left });
        setQuery(ctx.query);
        setContext({ start: ctx.start, insideChain: ctx.insideChain });
    }, [variables.length, closePopover]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange?.(event);
        requestAnimationFrame(refreshContext);
    };

    const handleKeyUp = () => refreshContext();
    const handleClick = () => refreshContext();
    const handleBlur = () => window.setTimeout(closePopover, 150);

    const handleSelect = (token: string) => {
        const node = inputRef.current;
        if (!node || context === null) return;
        const current = node.value;
        const caret = node.selectionStart ?? current.length;
        // A later term of a chain carries no braces of its own — they already opened the token.
        const inserted = context.insideChain ? ` ${token.replace(/^\{\{\s*|\s*\}\}$/g, '')}` : token;
        const next = current.slice(0, context.start) + inserted + current.slice(caret);
        const newCaret = context.start + inserted.length;

        const setter = Object.getOwnPropertyDescriptor(
            node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
            'value'
        )?.set;
        if (setter) setter.call(node, next);
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.setSelectionRange(newCaret, newCaret);
        node.focus();
        closePopover();
    };

    const hasInvalidVariables = invalidPlaceholders.length > 0;

    return (
        <React.Fragment>
            <DnInput
                {...rest}
                value={value ?? ''}
                onChange={handleChange}
                error={Boolean(error) || hasInvalidVariables}
                helperText={hasInvalidVariables ? 'Une ou plusieurs variables inconnues.' : helperText}
                inputProps={{
                    ...(rest.inputProps ?? {}),
                    ref: inputRef,
                    onKeyUp: handleKeyUp,
                    onClick: handleClick,
                    onBlur: handleBlur,
                }}
            />
            <DnInputInterpolatedPopover
                anchorPosition={anchor}
                query={query}
                variables={variables}
                onSelect={handleSelect}
                onClose={closePopover}
            />
        </React.Fragment>
    );
}
