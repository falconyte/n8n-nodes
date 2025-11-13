module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: ['@n8n_io/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules'],
};

