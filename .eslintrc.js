"use strict";

module.exports = {
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:vue/essential"
	],
	"globals": {
		"IMPORT_POLYFILLS": "readonly",
		"axios": "readonly"
	},
	"parser": "@babel/eslint-parser",
	"parserOptions": {
		"ecmaVersion": 12,
		"sourceType": "module",
		"requireConfigFile": false,
		"babelOptions": {
			"plugins": [ "babel-plugin-remove-template-literals-whitespace" ]
		}
	},
	"plugins": [
		"vue"
	],
	"rules": {
		"no-console": process.env.WEBPACK_DEV_SERVER ? "off" : "error",
		"no-debugger": process.env.WEBPACK_DEV_SERVER ? "off" : "error",
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		]
	}
};
