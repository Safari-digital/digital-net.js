/**
 * Default Digital-Net Prettier config
 * @example
 * import rules from '/path-to-package/prettier.js';
 * export default rules;
 * @type {import('prettier').Config}
 * */
const config = {
    embeddedLanguageFormatting: 'auto',
    arrowParens: 'avoid',
    bracketSpacing: true,
    endOfLine: 'auto',
    bracketSameLine: false,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'es5',
    useTabs: false,
    requirePragma: false,
    plugins: ['@trivago/prettier-plugin-sort-imports'],
    importOrder: ['^react(-dom)?(/|$)', '<THIRD_PARTY_MODULES>', '^@digital-net-org/', '^[~@]/', '^[./]'],
    importOrderSideEffects: false,
    importOrderSortSpecifiers: true,
};

export default config;
