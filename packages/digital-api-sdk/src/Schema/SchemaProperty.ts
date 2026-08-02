export type SchemaValueType =
    | 'String'
    | 'Int32'
    | 'Int64'
    | 'Double'
    | 'Decimal'
    | 'Boolean'
    | 'DateTime'
    | 'DateTimeOffset'
    | 'Guid'
    | 'Enum'
    | 'Collection';

export interface SchemaProperty {
    name: string;
    path: string;
    type: SchemaValueType;
    isReadOnly: boolean;
    isSecret: boolean;
    isRequired: boolean;
    isUnique: boolean;
    isTemplatable: boolean;
    maxLength: number | null;
    isIdentity: boolean;
    isForeignKey: boolean;
    regexValidation: string | null;
    enumValues: string[] | null;
    oneOfValues: string[] | null;
    /**
     * Child entity schema embedded on `Collection` properties whose rows are edited inline with the
     * parent (cascade pivots, flagged navigations). Null on scalars and server-managed collections.
     */
    children?: SchemaProperty[] | null;
}
