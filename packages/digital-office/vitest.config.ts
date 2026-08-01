import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        conditions: ['source', ...defaultClientConditions],
    },
    test: {
        globals: true,
        environment: 'happy-dom',
    },
});
