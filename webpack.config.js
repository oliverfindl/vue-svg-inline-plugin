"use strict";

const { resolve } = require("path");
const { DefinePlugin } = require("webpack");

const IMPORT_POLYFILLS = process.env.IMPORT_POLYFILLS | 0;

const BABEL_PLUGINS = ["babel-plugin-remove-template-literals-whitespace"];
const BABEL_PRESETS = IMPORT_POLYFILLS ? [["@babel/preset-env", {
	useBuiltIns: "usage",
	corejs: 3
}]] : [];

module.exports = {
	mode: "production",
	target: "web",
	entry: resolve(__dirname, "src/index.js"),
	output: {
		path: resolve(__dirname, "dist"),
		publicPath: "/",
		filename: `vue-svg-inline-plugin${!IMPORT_POLYFILLS ? "-modern" : ""}.min.js`,
		library: "VueSvgInlinePlugin",
		libraryExport: "default",
		libraryTarget: "umd"
	},
	module: {
		rules: [{
			enforce: "pre",
			test: /\.m?js$/i,
			exclude: /(node_modules|bower_components)/,
			loader: "eslint-loader",
			options: {
				emitError: true,
				emitWarning: true,
				failOnError: true,
				failOnWarning: true
			}
		}, {
			test: /\.m?js$/i,
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				plugins: BABEL_PLUGINS,
				presets: BABEL_PRESETS
			}
		}]
	},
	plugins: [
		new DefinePlugin({
			"IMPORT_POLYFILLS": JSON.stringify(IMPORT_POLYFILLS)
		})
	]
};