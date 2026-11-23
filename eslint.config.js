import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}', 'demo/**/*.{ts,tsx}', 'tests/{e2e,demo}/**/*.ts'],
        plugins: { 'react-hooks': hooks },
        rules: hooks.configs.recommended.rules,
    },
);
