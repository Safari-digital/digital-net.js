import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import { useDebouncedCallback } from '../../../hooks';
import { DnInput } from '../../DnInput';
import type { DnFilterDefinition } from '../DnEntityTable';

const DEBOUNCE_MS = 300;

interface LikeFilterProps {
    filter: Extract<DnFilterDefinition, { type: 'like' }>;
    value: string;
    onChange: (_patch: Record<string, string>) => void;
}

export function LikeFilter({ filter, value, onChange }: LikeFilterProps) {
    const [localValue, setLocalValue] = React.useState(value);
    const [prevValue, setPrevValue] = React.useState(value);

    if (prevValue !== value) {
        setPrevValue(value);
        setLocalValue(value);
    }

    const emit = useDebouncedCallback((next: string) => onChange({ [filter.key]: next }), DEBOUNCE_MS);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setLocalValue(next);
        emit.run(next);
    };

    return (
        <Stack sx={{ gap: 0.5 }}>
            <Typography variant="caption">{filter.label}</Typography>
            <DnInput value={localValue} placeholder={filter.placeholder} onChange={handleChange} />
        </Stack>
    );
}
