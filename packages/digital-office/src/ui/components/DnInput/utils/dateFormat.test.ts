import { describe, expect, it } from 'vitest';
import { DN_DATE_FORMATS, DN_DATE_INPUT_TYPES, type DnDateFormat, toDateInputValue, toDateInstant } from './dateFormat';

const INSTANT = '2026-08-11T15:30:45.000Z';

describe('toDateInputValue', () => {
    // The two formats carrying a time of day are rendered in the machine's zone, so they are asserted
    // through the round trip below rather than against a literal no test machine would agree on.
    it.each([
        ['yyyymmdd', '2026-08-11'],
        ['yyyymm', '2026-08'],
        ['yyyy', '2026'],
    ] as const)('renders %s at its own precision', (format, expected) => {
        expect(toDateInputValue(INSTANT, format)).toBe(expected);
    });

    it('renders a minute-precision value as the zone-less wall-clock the input accepts', () => {
        expect(toDateInputValue(INSTANT, 'yyyymmddhhmm')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('pins the minutes an hour-precision field cannot keep', () => {
        expect(toDateInputValue(INSTANT, 'yyyymmddhh')).toMatch(/T\d{2}:00$/);
    });

    it('reads a Date as readily as the string the API serves', () => {
        expect(toDateInputValue(new Date(INSTANT), 'yyyymmdd')).toBe('2026-08-11');
    });

    it.each(DN_DATE_FORMATS)('leaves %s empty when there is no value', format => {
        expect(toDateInputValue(null, format)).toBe('');
        expect(toDateInputValue(undefined, format)).toBe('');
        expect(toDateInputValue('', format)).toBe('');
    });

    it.each(DN_DATE_FORMATS)('leaves %s empty rather than passing an unreadable value on', format => {
        expect(toDateInputValue('not a date', format)).toBe('');
    });
});

describe('toDateInstant', () => {
    it('zeroes everything the format left out', () => {
        expect(toDateInstant('2026-08', 'yyyymm')).toBe('2026-08-01T00:00:00.000Z');
        expect(toDateInstant('2026-08-11', 'yyyymmdd')).toBe('2026-08-11T00:00:00.000Z');
        expect(toDateInstant('2026', 'yyyy')).toBe('2026-01-01T00:00:00.000Z');
    });

    it('drops the minutes of an hour-precision field', () => {
        const stored = toDateInstant('2026-08-11T15:30', 'yyyymmddhh');
        expect(stored).toBe(toDateInstant('2026-08-11T15:00', 'yyyymmddhh'));
        expect(stored).toMatch(/:00:00\.000Z$/);
    });

    it('answers an instant carrying its zone, not the wall-clock it was given', () => {
        const stored = toDateInstant('2026-08-11T15:30', 'yyyymmddhhmm');
        expect(stored).toMatch(/Z$/);
        expect(stored).not.toBe('2026-08-11T15:30');
    });

    it.each(DN_DATE_FORMATS)('clears the column when a %s field is emptied', format => {
        expect(toDateInstant('', format)).toBeNull();
    });

    it.each([
        ['2026-13', 'yyyymm'],
        ['2026-02-31', 'yyyymmdd'],
        ['31/12/2026', 'yyyymmddhhmm'],
    ] as [string, DnDateFormat][])('stores nothing rather than a wrong instant for %s', (value, format) => {
        expect(toDateInstant(value, format)).toBeNull();
    });
});

describe('defaults', () => {
    it('fills the time a day-precision format never asked for', () => {
        expect(toDateInstant('2026-08-11', 'yyyymmdd', { hour: 12 })).toBe('2026-08-11T12:00:00.000Z');
        expect(toDateInstant('2026-08-11', 'yyyymmdd', { hour: 12, minutes: 30 })).toBe('2026-08-11T12:30:00.000Z');
    });

    it('reaches the coarser formats too, on the first day they stand for', () => {
        expect(toDateInstant('2026-08', 'yyyymm', { hour: 12 })).toBe('2026-08-01T12:00:00.000Z');
        expect(toDateInstant('2026', 'yyyy', { hour: 12 })).toBe('2026-01-01T12:00:00.000Z');
    });

    it('fills the minutes of an hour-precision field, and shows the same ones', () => {
        expect(toDateInputValue('2026-08-11T15:00:00.000Z', 'yyyymmddhh', { minutes: 30 })).toMatch(/T\d{2}:30$/);
        expect(toDateInstant('2026-08-11T15:00', 'yyyymmddhh', { minutes: 30 })).toMatch(/:30:00\.000Z$/);
    });

    it('leaves a format that asks for the whole time alone', () => {
        const withDefaults = toDateInstant('2026-08-11T15:30', 'yyyymmddhhmm', { hour: 12, minutes: 45 });
        expect(withDefaults).toBe(toDateInstant('2026-08-11T15:30', 'yyyymmddhhmm'));
    });

    it('still zeroes when no default is given', () => {
        expect(toDateInstant('2026-08-11', 'yyyymmdd')).toBe('2026-08-11T00:00:00.000Z');
    });

    it('holds the round trip, so a filled value is not re-read as a different day', () => {
        const stored = toDateInstant('2026-08-11', 'yyyymmdd', { hour: 12 });
        expect(toDateInputValue(stored, 'yyyymmdd', { hour: 12 })).toBe('2026-08-11');
    });
});

describe('round trip', () => {
    it.each(DN_DATE_FORMATS)('holds %s across a display and a save', format => {
        const rendered = toDateInputValue(INSTANT, format);
        const stored = toDateInstant(rendered, format);

        expect(toDateInputValue(stored, format)).toBe(rendered);
    });

    it('holds a minute-precision instant exactly, seconds aside', () => {
        const stored = toDateInstant(toDateInputValue(INSTANT, 'yyyymmddhhmm'), 'yyyymmddhhmm');
        expect(stored).toBe('2026-08-11T15:30:00.000Z');
    });

    it('anchors a day to UTC, whatever zone the form was opened in', () => {
        expect(toDateInstant(toDateInputValue('2026-08-11T23:30:00.000Z', 'yyyymmdd'), 'yyyymmdd')).toBe(
            '2026-08-11T00:00:00.000Z'
        );
    });
});

describe('DN_DATE_INPUT_TYPES', () => {
    it('edits each format through the native input that fits it', () => {
        expect(DN_DATE_INPUT_TYPES).toEqual({
            yyyymmddhhmm: 'datetime-local',
            yyyymmddhh: 'datetime-local',
            yyyymmdd: 'date',
            yyyymm: 'month',
            yyyy: 'number',
        });
    });
});
