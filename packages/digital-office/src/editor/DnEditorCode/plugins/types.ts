export interface MarkerSpec {
    start: number;
    end: number;
    message: string;
    className: string;
}

export interface ResolvedMarker extends MarkerSpec {
    pluginId: string;
}

export interface AutocompleteTrigger {
    pattern: string;
}

export interface EditorPlugin {
    id: string;
    validate?: (_value: string) => MarkerSpec[];
    completers?: unknown[];
    replacesDefaultCompleters?: boolean;
    autocompleteTriggers?: AutocompleteTrigger[];
}
