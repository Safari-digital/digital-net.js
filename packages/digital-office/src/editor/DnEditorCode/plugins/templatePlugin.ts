import { validateInterpolatedString } from '../../../ui/components/DnInput/utils/interpolated';
import type { DnEditorTemplateVariable } from '../../types';
import { createTemplateCompleter } from '../aceTemplateCompleter';
import type { EditorPlugin } from './types';

export function templatePlugin(variables: DnEditorTemplateVariable[]): EditorPlugin {
    return {
        id: 'template',
        validate: value =>
            validateInterpolatedString(value, variables).map(err => ({
                start: err.start,
                end: err.end,
                message: err.message,
                className: 'dn-template-error',
            })),
        completers: [createTemplateCompleter(variables)],
        // `??` opens the next term of a fallback chain, so it deserves the same prompt as `{{`.
        autocompleteTriggers: [{ pattern: '{{' }, { pattern: '??' }],
    };
}
