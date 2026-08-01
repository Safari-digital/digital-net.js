import type { Ace } from 'ace-builds';
import ace from 'ace-builds/src-noconflict/ace';

interface AceRangeCtor {
    new (_startRow: number, _startCol: number, _endRow: number, _endCol: number): Ace.Range;
}

export const AceRange = (ace as unknown as { require: (_: string) => { Range: AceRangeCtor } }).require(
    'ace/range'
).Range;

export function offsetToRowCol(text: string, offset: number): { row: number; column: number } {
    let row = 0;
    let lineStart = 0;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') {
            row++;
            lineStart = i + 1;
        }
    }
    return { row, column: offset - lineStart };
}

export function rowColToOffset(text: string, row: number, column: number): number {
    let offset = 0;
    let currentRow = 0;
    for (let i = 0; i < text.length; i++) {
        if (currentRow === row) return offset + column;
        if (text[i] === '\n') {
            currentRow++;
            offset = i + 1;
        }
    }
    return text.length;
}
