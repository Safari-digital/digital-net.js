import { JSONLD_TYPES, getJsonLdDescription } from './schemas';

export interface Range {
    start: number;
    end: number;
}

export interface JsonLdValidationError {
    range: Range;
    message: string;
    severity: 'warning' | 'error';
    kind: 'unknown-key' | 'value-type';
}

type JsonNode =
    | { kind: 'object'; range: Range; members: { keyName: string; keyRange: Range; value: JsonNode }[] }
    | { kind: 'array'; range: Range; items: JsonNode[] }
    | { kind: 'string'; range: Range; value: string }
    | { kind: 'number'; range: Range; value: number; raw: string }
    | { kind: 'boolean'; range: Range; value: boolean }
    | { kind: 'null'; range: Range };

interface TypeAnchor {
    type: string;
    relativePath: string[];
}

const PRIMITIVE_TYPES = new Set([
    'Text',
    'URL',
    'Date',
    'DateTime',
    'Time',
    'Duration',
    'Number',
    'Integer',
    'Boolean',
    'Enum',
]);

export class JSONValidator {
    private input = '';
    private pos = 0;

    public validate(text: string): JsonLdValidationError[] {
        const ast = this.parse(text);
        if (!ast || ast.kind !== 'object') return [];
        const rootType = this.getObjectType(ast);
        if (!rootType || !JSONLD_TYPES[rootType]) return [];
        const errors: JsonLdValidationError[] = [];
        this.walkObject(ast, { type: rootType, relativePath: [] }, errors);
        return errors;
    }

    // -----------------------
    // AST parser
    // -----------------------

    private parse(text: string): JsonNode | null {
        this.input = text;
        this.pos = 0;
        try {
            this.skipWs();
            if (this.pos >= this.input.length) return null;
            const node = this.parseValue();
            this.skipWs();
            if (this.pos !== this.input.length) return null;
            return node;
        } catch {
            return null;
        }
    }

    private parseValue(): JsonNode {
        this.skipWs();
        const ch = this.input[this.pos];
        if (ch === '{') return this.parseObject();
        if (ch === '[') return this.parseArray();
        if (ch === '"') return this.parseString();
        if (ch === '-' || (ch >= '0' && ch <= '9')) return this.parseNumber();
        if (ch === 't' || ch === 'f') return this.parseBoolean();
        if (ch === 'n') return this.parseNull();
        throw new Error(`Unexpected character '${ch}' at ${this.pos}`);
    }

    private parseObject(): JsonNode {
        const start = this.pos;
        this.expect('{');
        const members: { keyName: string; keyRange: Range; value: JsonNode }[] = [];
        this.skipWs();
        if (this.input[this.pos] === '}') {
            this.pos++;
            return { kind: 'object', range: { start, end: this.pos }, members };
        }
        for (;;) {
            this.skipWs();
            const key = this.parseString();
            this.skipWs();
            this.expect(':');
            const value = this.parseValue();
            members.push({ keyName: key.value, keyRange: key.range, value });
            this.skipWs();
            const sep = this.input[this.pos];
            if (sep === ',') {
                this.pos++;
                continue;
            }
            if (sep === '}') {
                this.pos++;
                break;
            }
            throw new Error(`Expected ',' or '}' at ${this.pos}`);
        }
        return { kind: 'object', range: { start, end: this.pos }, members };
    }

    private parseArray(): JsonNode {
        const start = this.pos;
        this.expect('[');
        const items: JsonNode[] = [];
        this.skipWs();
        if (this.input[this.pos] === ']') {
            this.pos++;
            return { kind: 'array', range: { start, end: this.pos }, items };
        }
        for (;;) {
            items.push(this.parseValue());
            this.skipWs();
            const sep = this.input[this.pos];
            if (sep === ',') {
                this.pos++;
                continue;
            }
            if (sep === ']') {
                this.pos++;
                break;
            }
            throw new Error(`Expected ',' or ']' at ${this.pos}`);
        }
        return { kind: 'array', range: { start, end: this.pos }, items };
    }

    private parseString(): { kind: 'string'; range: Range; value: string } {
        const start = this.pos;
        this.expect('"');
        let value = '';
        while (this.pos < this.input.length) {
            const ch = this.input[this.pos];
            if (ch === '\\') {
                const next = this.input[this.pos + 1];
                if (next === '"' || next === '\\' || next === '/') value += next;
                else if (next === 'n') value += '\n';
                else if (next === 't') value += '\t';
                else if (next === 'r') value += '\r';
                else if (next === 'b') value += '\b';
                else if (next === 'f') value += '\f';
                else if (next === 'u') {
                    const code = parseInt(this.input.slice(this.pos + 2, this.pos + 6), 16);
                    value += String.fromCharCode(code);
                    this.pos += 6;
                    continue;
                } else value += next;
                this.pos += 2;
                continue;
            }
            if (ch === '"') {
                this.pos++;
                return { kind: 'string', range: { start, end: this.pos }, value };
            }
            value += ch;
            this.pos++;
        }
        throw new Error(`Unterminated string starting at ${start}`);
    }

    private parseNumber(): JsonNode {
        const start = this.pos;
        const match = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.input.slice(this.pos));
        if (!match || match.index !== 0) throw new Error(`Invalid number at ${this.pos}`);
        const raw = match[0];
        this.pos += raw.length;
        return { kind: 'number', range: { start, end: this.pos }, value: Number(raw), raw };
    }

    private parseBoolean(): JsonNode {
        const start = this.pos;
        if (this.input.startsWith('true', this.pos)) {
            this.pos += 4;
            return { kind: 'boolean', range: { start, end: this.pos }, value: true };
        }
        if (this.input.startsWith('false', this.pos)) {
            this.pos += 5;
            return { kind: 'boolean', range: { start, end: this.pos }, value: false };
        }
        throw new Error(`Invalid boolean at ${this.pos}`);
    }

    private parseNull(): JsonNode {
        const start = this.pos;
        if (this.input.startsWith('null', this.pos)) {
            this.pos += 4;
            return { kind: 'null', range: { start, end: this.pos } };
        }
        throw new Error(`Invalid null at ${this.pos}`);
    }

    private expect(ch: string): void {
        if (this.input[this.pos] !== ch) throw new Error(`Expected '${ch}' at ${this.pos}`);
        this.pos++;
    }

    private skipWs(): void {
        while (this.pos < this.input.length) {
            const ch = this.input[this.pos];
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') this.pos++;
            else break;
        }
    }

    // -----------------------
    // Validator walker
    // -----------------------

    private getObjectType(node: JsonNode): string | null {
        if (node.kind !== 'object') return null;
        const member = node.members.find(m => m.keyName === '@type');
        if (!member || member.value.kind !== 'string') return null;
        return member.value.value;
    }

    private walkObject(node: JsonNode, anchor: TypeAnchor, errors: JsonLdValidationError[]): void {
        if (node.kind !== 'object') return;
        const spec = JSONLD_TYPES[anchor.type];
        if (!spec) return;

        for (const member of node.members) {
            if (member.keyName === '@type' || member.keyName === '@context' || member.keyName === '@id') {
                this.walkValue(member, anchor, errors, member.keyName);
                continue;
            }
            const absolutePath = [...anchor.relativePath, member.keyName].join('.');
            const prop = spec.properties.find(p => p.property === absolutePath);
            if (!prop) {
                // Check if this is a container for nested dotted paths (e.g. 'author' has 'author.name').
                const hasNested = spec.properties.some(p => p.property.startsWith(absolutePath + '.'));
                if (!hasNested) {
                    errors.push({
                        range: member.keyRange,
                        message: `« ${member.keyName} » n'est pas une propriété valide de ${anchor.type}.`,
                        severity: 'warning',
                        kind: 'unknown-key',
                    });
                    continue;
                }
                // Nested container without direct entry — recurse into it to validate deeper keys.
                this.walkNestedContainer(member.value, anchor, member.keyName, errors);
                continue;
            }
            this.walkValue(member, anchor, errors, member.keyName, prop);
        }
    }

    private walkNestedContainer(
        value: JsonNode,
        anchor: TypeAnchor,
        keyName: string,
        errors: JsonLdValidationError[]
    ): void {
        if (value.kind === 'object') {
            const innerType = this.getObjectType(value);
            if (innerType && JSONLD_TYPES[innerType]) {
                this.walkObject(value, { type: innerType, relativePath: [] }, errors);
                return;
            }
            this.walkObject(value, { type: anchor.type, relativePath: [...anchor.relativePath, keyName] }, errors);
        } else if (value.kind === 'array') {
            for (const item of value.items) this.walkNestedContainer(item, anchor, keyName, errors);
        }
    }

    private walkValue(
        member: { keyName: string; keyRange: Range; value: JsonNode },
        anchor: TypeAnchor,
        errors: JsonLdValidationError[],
        key: string,
        prop?: { property: string; valueType: string; enumValues?: string[] }
    ): void {
        const value = member.value;

        if (prop) {
            const msg = this.validateValue(value, prop.valueType, prop.enumValues);
            if (msg) {
                const description = getJsonLdDescription(anchor.type, prop.property);
                errors.push({
                    range: value.range,
                    message: description ? `${msg}. ${description}` : msg,
                    severity: 'error',
                    kind: 'value-type',
                });
            }
        }

        // Recurse into objects/arrays to validate their keys.
        if (value.kind === 'object') {
            const innerType = this.getObjectType(value);
            if (innerType && JSONLD_TYPES[innerType]) {
                this.walkObject(value, { type: innerType, relativePath: [] }, errors);
            } else {
                this.walkObject(value, { type: anchor.type, relativePath: [...anchor.relativePath, key] }, errors);
            }
        } else if (value.kind === 'array') {
            for (const item of value.items) {
                if (item.kind === 'object') {
                    const innerType = this.getObjectType(item);
                    if (innerType && JSONLD_TYPES[innerType]) {
                        this.walkObject(item, { type: innerType, relativePath: [] }, errors);
                    } else {
                        this.walkObject(
                            item,
                            {
                                type: anchor.type,
                                relativePath: [...anchor.relativePath, key],
                            },
                            errors
                        );
                    }
                }
            }
        }
    }

    // -----------------------
    // Value type validation
    // -----------------------

    private validateValue(node: JsonNode, valueType: string, enumValues: string[] | undefined): string | null {
        const alternatives = valueType
            .split('|')
            .map(s => s.trim())
            .filter(Boolean);
        for (const alt of alternatives) {
            if (this.matchesType(node, alt, enumValues)) return null;
        }
        return `Type attendu : ${valueType}`;
    }

    private matchesType(node: JsonNode, type: string, enumValues: string[] | undefined): boolean {
        // Array suffix: "ListItem[]" → requires array.
        if (type.endsWith('[]')) return node.kind === 'array';

        if (PRIMITIVE_TYPES.has(type)) {
            switch (type) {
                case 'Text':
                    return node.kind === 'string' && this.matchesEnum(node.value, enumValues);
                case 'URL':
                    return node.kind === 'string' && this.isUrl(node.value);
                case 'Date':
                    return node.kind === 'string' && this.isDate(node.value);
                case 'DateTime':
                    return node.kind === 'string' && this.isDateTime(node.value);
                case 'Time':
                    return node.kind === 'string' && this.isTime(node.value);
                case 'Duration':
                    return node.kind === 'string' && /^P/i.test(node.value);
                case 'Number':
                    return node.kind === 'number';
                case 'Integer':
                    return node.kind === 'number' && Number.isInteger(node.value);
                case 'Boolean':
                    return node.kind === 'boolean';
                case 'Enum':
                    return node.kind === 'string' && this.matchesEnum(node.value, enumValues);
            }
        }

        // Capitalized type name not in primitives → schema.org object reference.
        // Lenient: accept object, array (array of such objects), or string (shorthand @id / url).
        if (/^[A-Z]/.test(type)) {
            return node.kind === 'object' || node.kind === 'array' || node.kind === 'string';
        }

        // Unknown lowercase token → be lenient.
        return true;
    }

    private matchesEnum(value: string, enumValues: string[] | undefined): boolean {
        if (!enumValues || enumValues.length < 2) return true; // no enum declared — accept anything
        return enumValues.includes(value);
    }

    private isUrl(value: string): boolean {
        return /^(https?:\/\/|\/)/i.test(value);
    }

    private isDate(value: string): boolean {
        // YYYY, YYYY-MM, YYYY-MM-DD
        return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value);
    }

    private isDateTime(value: string): boolean {
        // Accept Date as well (ISO 8601 allows date-only), plus full date-time with optional zone.
        if (this.isDate(value)) return true;
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(value);
    }

    private isTime(value: string): boolean {
        return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
    }
}
