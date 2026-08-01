import type { DnEditorLanguage } from '../types';

const parserMap: Record<DnEditorLanguage, string> = {
    javascript: 'babel',
    html: 'html',
    css: 'css',
    json: 'json',
    jsonld: 'json',
};

export const resolveParserName = (str: DnEditorLanguage) => parserMap[str];
