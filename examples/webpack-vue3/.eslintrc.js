"use strict";

module.exports = {
	"root": true,
	"env": {
		"browser": true,
		"es2021": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:vue/vue3-essential"
	],
	"parserOptions": {
		"ecmaVersion": 12,
		"parser": "babel-eslint",
		"sourceType": "module"
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
