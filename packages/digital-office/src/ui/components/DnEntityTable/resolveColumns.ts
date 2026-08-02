import type * as React from 'react';
import type { SchemaProperty } from '@digital-net-org/digital-api-sdk';

export type DnColumnDefinition<T> =
    | { kind?: 'schema'; key: keyof T; label?: string }
    | {
          kind: 'computed';
          key: string;
          label: string;
          compute: (_row: T) => React.ReactNode;
      };

export type DnResolvedColumn<T = unknown> =
    | { kind: 'schema'; header: string; accessor: string; schema: SchemaProperty }
    | {
          kind: 'computed';
          header: string;
          accessor: string;
          compute: (_row: T) => React.ReactNode;
      };

export function resolveColumns<T>(schema: SchemaProperty[], columns?: DnColumnDefinition<T>[]): DnResolvedColumn<T>[] {
    const base: DnResolvedColumn<T>[] = schema
        .filter(prop => !prop.isSecret && !prop.isIdentity && prop.type !== 'Collection')
        .map(prop => ({
            kind: 'schema' as const,
            header: prop.name,
            accessor: prop.path.charAt(0).toLowerCase() + prop.path.slice(1),
            schema: prop,
        }));

    if (!columns || columns.length === 0) return base;

    const byAccessor = new Map(base.flatMap(c => (c.kind === 'schema' ? [[c.accessor, c] as const] : [])));

    return columns
        .map<DnResolvedColumn<T> | null>(def => {
            if (def.kind === 'computed') {
                return {
                    kind: 'computed',
                    header: def.label,
                    accessor: def.key,
                    compute: def.compute,
                };
            }
            const col = byAccessor.get(String(def.key));
            if (!col) return null;
            return { ...col, header: def.label ?? col.header };
        })
        .filter((c): c is DnResolvedColumn<T> => c !== null);
}
