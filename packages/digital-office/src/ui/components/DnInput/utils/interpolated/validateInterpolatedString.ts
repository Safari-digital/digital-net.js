import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';

interface InvalidPlaceholder {
    start: number;
    end: number;
    raw: string;
    inner: string;
    message: string;
}

const PLACEHOLDER_REGEX = /\{\{([^{}]*)\}\}/g;
const DOTTED_VARIABLE_REGEX = /^([a-z][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/;

/** Separates the terms of a fallback chain: `{{ article.metaTitle ?? article.title }}`. */
export const FALLBACK_SEPARATOR = '??';

const buildVariableSet = (variables: TemplateVariable[]) =>
    new Set(variables.map(v => `${v.source.toLowerCase()}.${v.field.toLowerCase()}`));

export function validateInterpolatedString(
    value: string | null | undefined,
    variables: TemplateVariable[]
): InvalidPlaceholder[] {
    if (!value || value.length === 0) {
        return [];
    }

    const known = buildVariableSet(variables);
    const invalid: InvalidPlaceholder[] = [];

    PLACEHOLDER_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = PLACEHOLDER_REGEX.exec(value)) !== null) {
        const inner = match[1].trim();
        if (inner.length === 0) continue;

        // Every term of the chain is checked: one unknown term does not invalidate the others, but it
        // is still worth flagging — the engine skips it silently.
        const terms = inner.split(FALLBACK_SEPARATOR).map(term => term.trim());
        const malformed = terms.filter(term => !DOTTED_VARIABLE_REGEX.test(term.toLowerCase()));
        const unknown = terms.filter(
            term => DOTTED_VARIABLE_REGEX.test(term.toLowerCase()) && !known.has(term.toLowerCase())
        );
        if (malformed.length === 0 && unknown.length === 0) continue;

        invalid.push({
            start: match.index,
            end: match.index + match[0].length,
            raw: match[0],
            inner,
            message: buildMessage(malformed, unknown),
        });
    }

    return invalid;
}

function buildMessage(malformed: string[], unknown: string[]): string {
    if (malformed.length > 0) {
        return `Expression invalide. Format attendu : "{{ source.champ }}", termes séparés par "${FALLBACK_SEPARATOR}".`;
    }
    return unknown.length === 1
        ? `La variable "{{ ${unknown[0]} }}" n'existe pas.`
        : `Ces variables n'existent pas : ${unknown.map(term => `"${term}"`).join(', ')}.`;
}
