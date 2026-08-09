import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import vanilla from 'safaridigital-eslint/vanilla';

/**
 * `safaridigital-eslint/vanilla` plus the React layer, which the shared config does not carry.
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
    ...vanilla,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: { version: '19' },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooksPlugin.configs.recommended.rules,
        },
    },
];

export default config;
