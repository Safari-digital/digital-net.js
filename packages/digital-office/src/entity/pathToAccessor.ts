export function pathToAccessor(path: string): string {
    if (!path.startsWith('/')) return path;
    return path.slice(1).split('/')[0];
}
