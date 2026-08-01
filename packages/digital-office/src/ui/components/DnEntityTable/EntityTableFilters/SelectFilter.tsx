import { MenuItem, Select, Stack, Typography } from '@mui/material';
import type { DnFilterDefinition } from '../DnEntityTable';

interface SelectFilterProps {
    filter: Extract<DnFilterDefinition, { type: 'select' }>;
    value: string;
    onChange: (_patch: Record<string, string>) => void;
}

export function SelectFilter({ filter, value, onChange }: SelectFilterProps) {
    return (
        <Stack sx={{ gap: 0.5 }}>
            <Typography variant="caption">{filter.label}</Typography>
            <Select value={value} displayEmpty onChange={e => onChange({ [filter.key]: e.target.value })}>
                <MenuItem value="">— Tous —</MenuItem>
                {filter.options.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        </Stack>
    );
}
