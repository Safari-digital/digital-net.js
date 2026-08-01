import * as React from 'react';
import type { ArticleDto } from '@digital-net-org/digital-api-sdk';
import { DnContentEditor } from '../../../editor';
import { useDnEntityFormContext } from '../../../entity';

export function ArticleTabContent() {
    const { values, setField, disabled } = useDnEntityFormContext<ArticleDto>();
    const handleChange = React.useCallback((next: string) => setField('/content', next), [setField]);
    return <DnContentEditor value={values.content ?? ''} onChange={handleChange} disabled={disabled} />;
}
