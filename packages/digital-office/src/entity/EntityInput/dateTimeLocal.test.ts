import { describe, expect, it } from 'vitest';
import { fromDateTimeLocal, toDateTimeLocal } from './dateTimeLocal';

// Asserted without pinning a zone: the machine running the suite decides the offset, so the tests
// state the contract — a wall-clock the input accepts, and the same instant on the way back.
describe('toDateTimeLocal', () => {
    it('renders an instant as a zone-less wall-clock the input accepts', () => {
        expect(toDateTimeLocal('2026-01-27T12:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('reads a Date as readily as the string the API serves', () => {
        const iso = '2026-01-27T12:00:00Z';
        expect(toDateTimeLocal(new Date(iso))).toBe(toDateTimeLocal(iso));
    });

    it.each([[null], [undefined], ['']])('leaves the field empty for %s', value => {
        expect(toDateTimeLocal(value)).toBe('');
    });

    it('leaves the field empty rather than passing an unparsable value on', () => {
        expect(toDateTimeLocal('not a date')).toBe('');
    });
});

describe('fromDateTimeLocal', () => {
    it('answers an instant carrying its zone, not the wall-clock it was given', () => {
        const stored = fromDateTimeLocal('2026-01-27T13:00');
        expect(stored).toMatch(/Z$/);
        expect(stored).not.toBe('2026-01-27T13:00');
    });

    it('clears the column when the field is emptied', () => {
        expect(fromDateTimeLocal('')).toBeNull();
    });

    it('answers null on an unparsable value', () => {
        expect(fromDateTimeLocal('31/12/2026')).toBeNull();
    });
});

describe('round trip', () => {
    it('holds the instant across a display and a save', () => {
        const iso = '2026-01-27T12:00:00Z';
        expect(fromDateTimeLocal(toDateTimeLocal(iso))).toBe('2026-01-27T12:00:00.000Z');
    });

    it('holds it across a zone that offsets by more than a day boundary', () => {
        const iso = '2026-01-27T23:30:00Z';
        expect(fromDateTimeLocal(toDateTimeLocal(iso))).toBe('2026-01-27T23:30:00.000Z');
    });

    it('truncates to the minute, which is all the input carries', () => {
        expect(fromDateTimeLocal(toDateTimeLocal('2026-01-27T12:00:45Z'))).toBe('2026-01-27T12:00:00.000Z');
    });
});
