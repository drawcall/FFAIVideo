module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  ignorePatterns: ['test/*', '*.d.ts'],
  plugins: ['@typescript-eslint', 'simple-import-sort', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-typescript/base',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
    'import/no-extraneous-dependencies': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    '@typescript-eslint/indent': 'off',
    'import/no-cycle': 'off',
    'prefer-const': 'off'
  },
};
