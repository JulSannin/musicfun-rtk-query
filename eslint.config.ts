import eslintReact from '@eslint-react/eslint-plugin';
import eslintJs from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores([
        'dist',
        'api-generated',
        'eslint.config.ts',
        'steiger.config.ts',
        'openapi-ts.config.ts',
    ]),
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [
            eslintJs.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            eslintReact.configs['recommended-typescript'],
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            parser: tseslint.parser,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: { attributes: false } },
            ],
        },
    }
);
