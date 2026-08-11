/**
 * The precision a date is edited at. The API stores an instant either way — this only decides how
 * much of it the editor is asked for, and how much is zeroed on the way back.
 */
export const DN_DATE_FORMATS = ['yyyymmddhhmm', 'yyyymmddhh', 'yyyymmdd', 'yyyymm', 'yyyy'] as const;

export type DnDateFormat = (typeof DN_DATE_FORMATS)[number];

export type DnDateInputType = 'datetime-local' | 'date' | 'month' | 'number';

/** The native input each format is edited through. There is none for a year, so it is a number. */
export const DN_DATE_INPUT_TYPES: Record<DnDateFormat, DnDateInputType> = {
    yyyymmddhhmm: 'datetime-local',
    yyyymmddhh: 'datetime-local',
    yyyymmdd: 'date',
    yyyymm: 'month',
    yyyy: 'number',
};

/**
 * What to fill in for the parts a format does not ask for. Left out, they are zeroed — which puts a
 * day-precision date on midnight, and a midnight UTC slides to the previous evening west of the
 * meridian. Noon is the usual answer to that, and it is a caller's decision rather than a default.
 */
export interface DnDateDefaults {
    /** 0–23. Applies to the formats stopping at the day or coarser. */
    hour?: number;
    /** 0–59. Applies wherever the format does not ask for minutes, hour precision included. */
    minutes?: number;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** The time of day the defaults stand for, as the `HH:mm` both directions splice in. */
function toDefaultTime(defaults: DnDateDefaults | undefined): string {
    return `${pad(defaults?.hour ?? 0)}:${pad(defaults?.minutes ?? 0)}`;
}

/**
 * Reads whatever the form holds. An instant and a value already shaped for the input both land here,
 * and Date tells them apart on its own: a string carrying a zone is an instant, a zone-less
 * date-time is local, and a date-only form is UTC — which is exactly how each is meant to be read.
 */
function toDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;

    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

/** The local wall-clock `YYYY-MM-DDTHH:mm`, the only shape a datetime-local accepts. */
function toWallClock(date: Date): string {
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Renders what the form holds at the precision the input shows. Anything unreadable reads as empty.
 *
 * A format carrying a time of day denotes a moment, so it is read and written in the editor's own
 * zone: 13:00 typed in Paris is 12:00Z. A format stopping at the day denotes a calendar bucket
 * instead, anchored to UTC — August 2026 is 2026-08-01T00:00:00.000Z wherever it was entered, rather
 * than a value sliding a day backwards depending on who opened the form.
 */
export function toDateInputValue(value: unknown, format: DnDateFormat, defaults?: DnDateDefaults): string {
    const date = toDate(value);
    if (date === null) return '';

    switch (format) {
        case 'yyyymmddhhmm':
            return toWallClock(date);
        // The input still carries a minutes segment; it is pinned rather than hidden, and pinned to
        // the same value the save splices in so the two never disagree.
        case 'yyyymmddhh':
            return `${toWallClock(date).slice(0, 13)}:${pad(defaults?.minutes ?? 0)}`;
        case 'yyyymmdd':
            return date.toISOString().slice(0, 10);
        case 'yyyymm':
            return date.toISOString().slice(0, 7);
        case 'yyyy':
            return date.toISOString().slice(0, 4);
    }
}

/**
 * Turns what the input gives back into the instant the API stores, filling everything the format left
 * out with the defaults. An emptied field answers null, which clears the column rather than failing
 * on it.
 */
export function toDateInstant(value: string, format: DnDateFormat, defaults?: DnDateDefaults): string | null {
    if (value === '') return null;

    const shown = toShownValue(value, format, defaults);
    const date = toDate(toParsable(shown, format, defaults));
    if (date === null) return null;

    // Date rolls an impossible calendar value over rather than refusing it — 31 February lands on
    // 3 March. Rendering the result back is what catches that, and stores nothing instead of a date
    // nobody asked for.
    const instant = date.toISOString();
    return toDateInputValue(instant, format, defaults) === shown ? instant : null;
}

/** The entry as the input ends up showing it, once the format's own filling is applied. */
function toShownValue(value: string, format: DnDateFormat, defaults: DnDateDefaults | undefined): string {
    if (format === 'yyyymmddhh') return `${value.slice(0, 13)}:${pad(defaults?.minutes ?? 0)}`;
    if (format === 'yyyy') return value.padStart(4, '0');
    return value;
}

/**
 * The same value as something Date can read. The day-and-coarser formats are anchored to UTC, so the
 * defaults they splice in are UTC too: noon on a day-precision field is noon UTC, the one time of day
 * that lands on the intended date in every zone the site is read from.
 */
function toParsable(shown: string, format: DnDateFormat, defaults: DnDateDefaults | undefined): string {
    switch (format) {
        case 'yyyymmddhhmm':
        case 'yyyymmddhh':
            return shown;
        case 'yyyymmdd':
            return `${shown}T${toDefaultTime(defaults)}:00.000Z`;
        case 'yyyymm':
            return `${shown}-01T${toDefaultTime(defaults)}:00.000Z`;
        case 'yyyy':
            return `${shown}-01-01T${toDefaultTime(defaults)}:00.000Z`;
    }
}
