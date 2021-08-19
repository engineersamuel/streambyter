module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'airbnb-typescript/base'
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.lint.json']
      }
    }
  ],
  rules: {
    "max-len": ["error", { "code": 180, "tabWidth": 2 }],
    "comma-dangle": "off",
    "prefer-destructuring": "off",
    "object-curly-newline": "off",
    "no-restricted-syntax": "off",
    "no-console": "off",
    "no-plusplus": "off",
    "no-nested_ternary": "off",
    "arrow-body-style": "off",
    "import/order": "off",
    "no-nested-ternary": "off",
    "@typescript-eslint/lines-between-class-members": "off",
    "@typescript-eslint/comma-dangle": "off",
    "react/prop-types": "off",
    "react/jsx-boolean-value": "off",
    "react/jsx-props-no-spreading": "off",
    "react/destructuring-assignment": "off",
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off"
  },
  ignorePatterns: [
    '.eslintrc.js',
    'craco.config.js',
    'node_modules',
    'dist'
  ]
};

