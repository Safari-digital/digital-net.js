export interface IDbConfig {
    name: string;
    stores: ReadonlyArray<string>;
    /** Stores left over from an earlier naming scheme, deleted on the next upgrade. */
    obsoleteStores?: ReadonlyArray<string>;
}
