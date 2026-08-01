import * as React from 'react';
import type { OpenGraphPropertySchema } from '@digital-net-org/digital-api-sdk';
import { useOgSchemaContext } from '../../../entity';

export interface UseOgSchemaResult {
    schema: OpenGraphPropertySchema[];
    loading: boolean;
    error: Error | null;
    reload: () => void;
}

export function useOgSchema(): UseOgSchemaResult {
    const { schema, error, loading, loadSchema, reload } = useOgSchemaContext();
    React.useEffect(() => loadSchema(), [loadSchema]);

    return {
        schema: schema ?? [],
        loading: loading || schema === null,
        error,
        reload,
    };
}
