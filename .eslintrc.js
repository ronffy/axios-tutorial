/*
** 项目工作台-代码检测规则
** create by whr
** time: 2017.11.8
*/
module.exports = {
  env: {
    browser: true,
    node: true,
    "es6": true
  },
  "rules": {
    "radix": 0,
    "no-plusplus": 0,
    "import/first": 0,
    "class-methods-use-this": 0,
    "array-callback-return": 0,
    "no-mixed-operators": 0,
    "no-irregular-whitespace": 0,
    "react/no-unescaped-entities": 0,
    "no-prototype-builtins": 0,
    "template-curly-spacing": 0,
    "arrow-parens": 0,
    "space-infix-ops": 0,
    "jsx-a11y/alt-text": 0,
    "no-shadow": 0,
    "consistent-return": 0,
    "no-case-declarations": 0,
    "wrap-iife": 0,
    "camelcase": 0,
    "quotes": 0,
    "jsx-a11y/no-noninteractive-element-interactions": 0,
    "semi": [
      0,
      "never"
    ],
    "no-console": 0,
    "no-extra-semi": 1,
    "no-func-assign": 1,
    "no-unreachable": 1,
    "constructor-super": 2,
    "no-const-assign": 2,
    "no-var": 1,
    "no-eval": 1,
    "no-unused-vars": 1,
    "no-debugger": 1,
    "one-var": 0,
    "comma-dangle": 0,
    "max-len": 0,
    "react/jsx-first-prop-new-line": 0,
    "react/jsx-filename-extension": 0,
    "space-before-function-paren": 0,
    "no-unused-expressions": [
      0,
      {
        "allowShortCircuit": true,
        "allowTernary": true
      }
    ],
    "arrow-body-style": [
      0,
      "never"
    ],
    "func-names": 0,
    "prefer-const": 0,
    "no-extend-native": 0,
    "no-param-reassign": 0,
    "no-restricted-syntax": 0,
    "no-continue": 0,
    "react/jsx-no-bind": 0,
    "no-underscore-dangle": 0,
    "global-require": 0,
    "import/no-unresolved": 0,
    "import/extensions": 0,
    "jsx-a11y/href-no-hash": 0,
    "react/no-array-index-key": 0,
    "react/require-default-props": 0,
    "react/forbid-prop-types": 0,
    "react/no-string-refs": 0,
    "react/no-find-dom-node": 0,
    "react/prefer-stateless-function": 0,
    "import/no-extraneous-dependencies": 0,
    "import/prefer-default-export": 0,
    "react/no-danger": 0,
    "jsx-a11y/no-static-element-interactions": 0,
    "space-before-blocks": 0,
    "indent": 0,
    "no-tabs": 0,
    "no-mixed-spaces-and-tabs": 0,
    "quote-props": 0,
    "react/jsx-indent": 0,
    "react/sort-comp": 0,
    "react/prop-types": 0,
    "no-trailing-spaces": 0,
    "object-shorthand": 0,
    "react/jsx-curly-spacing": 0,
    "import/newline-after-import": 0,
    "object-curly-spacing": 0,
    "keyword-spacing": 0,
    "no-else-return": 0,
    "prefer-template": 0,
    "no-return-assign": 0,
    "vars-on-top": 0,
    "spaced-comment": 0,
    "react/self-closing-comp": 0,
    "no-lonely-if": 0,
    'linebreak-style': 'off',
  },
  "parser": "babel-eslint", //解析器
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 8,
    "ecmaFeatures": {
      "jsx": true,
      "experimentalObjectRestSpread": true
    }
  },
  "settings": {
    "import/resolver": "node",
  }
}