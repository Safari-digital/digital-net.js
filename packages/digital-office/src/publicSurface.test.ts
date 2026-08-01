import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const PUBLIC_NAMING = /^(Dn[A-Z]|useDn[A-Z]|UseDn[A-Z]|LazyDn[A-Z]|dn[A-Z]|DN_|(use)?DigitalOffice|(use)?DigitalNet)/;
const SRC_DIR = import.meta.url.slice('file://'.length, import.meta.url.lastIndexOf('/') + 1);

const ENTRY_POINTS = {
    '.': `${SRC_DIR}index.ts`,
    './ui': `${SRC_DIR}ui/index.ts`,
};

function readExports(): Record<string, string[]> {
    const configFile = ts.readConfigFile(`${SRC_DIR}../tsconfig.json`, ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, `${SRC_DIR}..`);
    const program = ts.createProgram(Object.values(ENTRY_POINTS), options);
    const checker = program.getTypeChecker();

    return Object.fromEntries(
        Object.entries(ENTRY_POINTS).map(([entrypoint, path]) => {
            const sourceFile = program.getSourceFile(path);
            if (!sourceFile) throw new Error(`Entrypoint source not found: ${path}`);
            const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
            if (!moduleSymbol) throw new Error(`Entrypoint has no module symbol: ${path}`);
            const names = checker
                .getExportsOfModule(moduleSymbol)
                .map(symbol => symbol.name)
                .sort();
            return [entrypoint, names];
        })
    );
}

const surface = readExports();

describe('public surface', () => {
    it.each(Object.keys(ENTRY_POINTS))('every export of "%s" follows the public naming convention', entrypoint => {
        const offenders = surface[entrypoint].filter(name => !PUBLIC_NAMING.test(name));
        expect(offenders).toEqual([]);
    });

    it.each(Object.keys(ENTRY_POINTS))('exports of "%s" are stable', entrypoint => {
        expect(surface[entrypoint]).toMatchSnapshot();
    });
});
