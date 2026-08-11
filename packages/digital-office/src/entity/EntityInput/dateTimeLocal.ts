/**
 * `<input type="datetime-local">` speaks wall-clock time and nothing else: it rejects any value
 * carrying a zone — `2026-01-27T12:00:00Z` included — by blanking itself, and it hands back a
 * zone-less string the API cannot store on a `timestamptz` column. The API, on both ends, speaks
 * instants. These two functions are that translation, and they are the reason the field neither
 * renders empty nor fails to save.
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** Instant as the API serves it → local wall-clock the input accepts. Anything unparsable reads as empty. */
export function toDateTimeLocal(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return '';

    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Local wall-clock the input produces → instant the API stores. An emptied field clears the column,
 * so it answers null rather than the empty string the input hands over.
 */
export function fromDateTimeLocal(value: string): string | null {
    if (value === '') return null;

    // No zone in the string, so this reads as local time — the very thing the user typed.
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
