import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import type { DnFilterDefinition } from '../DnEntityTable';

interface BooleanFilterProps {
    filter: Extract<DnFilterDefinition, { type: 'boolean' }>;
    value: string;
    onChange: (_patch: Record<string, string>) => void;
}

export function BooleanFilter({ filter, value, onChange }: BooleanFilterProps) {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={value === 'true'}
                    onChange={e => onChange({ [filter.key]: e.target.checked ? 'true' : '' })}
                />
            }
            label={<Typography variant="body2">{filter.label}</Typography>}
        />
    );
}
