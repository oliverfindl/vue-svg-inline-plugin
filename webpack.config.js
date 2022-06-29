"use strict";

const { resolve } = require("path");
const { DefinePlugin } = require("webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const IMPORT_POLYFILLS = process.env.IMPORT_POLYFILLS | 0;

const BABEL_PLUGINS = [ "babel-plugin-remove-template-literals-whitespace" ];
const BABEL_PRESETS = IMPORT_POLYFILLS ? [ [ "@babel/preset-env", {
	debug: !!IMPORT_POLYFILLS,
	useBuiltIns: "usage",
	corejs: 3
} ] ] : [];

module.exports = {
	entry: resolve(__dirname, "src"),
	mode: "production",
	output: {
		filename: `vue-svg-inline-plugin${!IMPORT_POLYFILLS ? "-modern" : ""}.min.js`,
		library: "VueSvgInlinePlugin",
		libraryExport: "default",
		libraryTarget: "umd",
		path: resolve(__dirname, "dist")
	},
	module: {
		rules: [ {
			test: /\.m?js$/i,
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				plugins: BABEL_PLUGINS,
				presets: BABEL_PRESETS
			}
		} ]
	},
	resolve: {
		extensions: [ ".js", ".mjs" ]
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: false
			})
		]
	},
	plugins: [
		new DefinePlugin({
			"IMPORT_POLYFILLS": JSON.stringify(IMPORT_POLYFILLS)
		}),
		new ESLintPlugin({
			files: [ "src/**/*.{js,mjs}" ]
		}),
		...IMPORT_POLYFILLS ? [ new BundleAnalyzerPlugin() ] : []
	],
	externals: {
		vue: "Vue"
	}
};
