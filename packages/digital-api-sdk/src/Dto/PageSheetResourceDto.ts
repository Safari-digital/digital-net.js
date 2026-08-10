/**
 * A sheet of a page, inheritance applied and placeholders already hydrated. Lets a client render a page
 * in one round-trip instead of one per sheet.
 */
export interface PageSheetResourceDto {
    id: string;
    name: string;
    type: string;
    content: string;
}
