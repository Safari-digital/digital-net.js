import type { Ace } from 'ace-builds';

export const aceOptions: Partial<Ace.EditorOptions> = {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    useWorker: false,
    showPrintMargin: false,
    fontSize: 13,
};
