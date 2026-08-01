import * as React from 'react';
import type { MediaDto } from '@digital-net-org/digital-api-sdk';
import { useDnEntityFormContext } from '../../entity';

export interface MediaWithLabel extends MediaDto {
    label: string;
}

export interface DnMediaPivotRow {
    label: string;
    media: MediaDto | null;
}

const stripLabel = ({ label: _label, ...media }: MediaWithLabel): MediaDto => media;

export function useDnMediaPivot(labels: readonly string[]) {
    const { values, setField, disabled, errors } = useDnEntityFormContext<{ media?: MediaWithLabel[] }>();

    const rows = React.useMemo<DnMediaPivotRow[]>(
        () =>
            labels.map(label => {
                const entry = values.media?.find(m => m.label === label);
                return { label, media: entry ? stripLabel(entry) : null };
            }),
        [labels, values.media]
    );

    const handleChange = React.useCallback(
        (label: string, media: MediaDto | null) => {
            const others = (values.media ?? []).filter(m => m.label !== label);
            const next: MediaWithLabel[] = media ? [...others, { ...media, label }] : others;
            setField('/media', next);
        },
        [setField, values.media]
    );

    return { rows, handleChange, disabled, errors };
}
