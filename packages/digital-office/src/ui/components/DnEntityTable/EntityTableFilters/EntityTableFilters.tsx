import { Stack } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { DnButton } from '../../DnButton';
import type { DnFilterDefinition } from '../DnEntityTable';
import { BooleanFilter } from './BooleanFilter';
import { LikeFilter } from './LikeFilter';
import { SelectFilter } from './SelectFilter';

interface EntityTableFiltersProps {
    filters: DnFilterDefinition[];
    values: Record<string, string>;
    onChange: (_patch: Record<string, string>) => void;
    onReset: () => void;
}

export function EntityTableFilters({ filters, values, onChange, onReset }: EntityTableFiltersProps) {
    return (
        <Root>
            {filters.map(filter => {
                const value = values[filter.key] ?? '';
                if (filter.type === 'boolean')
                    return <BooleanFilter key={filter.key} filter={filter} value={value} onChange={onChange} />;
                if (filter.type === 'select')
                    return <SelectFilter key={filter.key} filter={filter} value={value} onChange={onChange} />;
                return <LikeFilter key={filter.key} filter={filter} value={value} onChange={onChange} />;
            })}
            <DnButton
                onClick={onReset}
                disabled={Object.values(values).filter(Boolean).length < 1}
                sx={{ width: '100%' }}
            >
                Réinitialiser
            </DnButton>
        </Root>
    );
}

const Root = styled(Stack)(
    ({ theme }) => css`
        padding: ${theme.spacing(2)};
        min-width: 260px;
        gap: ${theme.spacing(1.5)};
    `
);
