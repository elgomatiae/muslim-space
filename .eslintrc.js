
module.exports = {
  extends: ['expo'],
  rules: {
    // TS version (5.9+) is outside what eslint-plugin-import's resolver supports.
    // This rule crashes the lint run instead of producing actionable lint errors.
    'import/namespace': 'off',

    // Your lint run currently fails hard due to `import/no-unresolved`:
    //  - it triggers the same TS resolver crash
    //  - it also can’t resolve `@/` aliases in ESLint without extra resolver config
    'import/no-unresolved': 'off',

    // These rules are referenced by the upstream Expo config, but your installed
    // @typescript-eslint version doesn’t provide them (eslint: "Definition ... was not found").
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
  },
  overrides: [
    {
      files: ['supabase/functions/**/*.ts'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
  ],
};
