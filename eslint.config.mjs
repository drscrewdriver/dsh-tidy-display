import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**', 'coverage/**', 'skills/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // tsc already rejects undefined identifiers in strict mode; no-undef cannot read TS types.
      'no-undef': 'off',
      // Host/plugin boundary surfaces are loosely typed on purpose (`ctx: any` etc.).
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // verify-*.mjs drive the running client, so they touch window/document too.
    files: ['tests/**', 'scripts/**', 'tools/**', '*.config.*'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
