// Lexical hardcodes `white-space: pre-wrap` on every text span it exports (TextNode.exportDOM).
// Any formatter that re-wraps long lines then injects newlines *inside* a whitespace-sensitive
// element, which the next import reads back as real line breaks — one more at every round-trip.
export function stripWhiteSpaceStyle<T extends ParentNode>(root: T): T {
    if (root instanceof HTMLElement) removeWhiteSpaceStyle(root);
    root.querySelectorAll<HTMLElement>('[style*="white-space"]').forEach(removeWhiteSpaceStyle);
    return root;
}

function removeWhiteSpaceStyle(element: HTMLElement) {
    element.style.removeProperty('white-space');
    if (!element.getAttribute('style')) element.removeAttribute('style');
}
