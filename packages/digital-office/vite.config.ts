import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                ui: resolve(__dirname, 'src/ui/index.ts'),
            },
            name: 'digital-office',
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'react-router',
                /^@tanstack\/.*/,
                /^@mui\/.*/,
                /^@emotion\/.*/,
                /^@digital-net-org\/.*/,
            ],
        },
        emptyOutDir: true,
    },
    plugins: [
        dts({
            tsconfigPath: './tsconfig.build.json',
            entryRoot: 'src',
        }),
    ],
});
