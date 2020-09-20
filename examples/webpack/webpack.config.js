"use strict";

const { resolve } = require("path");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const BABEL_PLUGINS = [ "@babel/plugin-syntax-dynamic-import" ];
const BABEL_PRESETS = [ [ "@babel/preset-env", {
	useBuiltIns: "usage",
	corejs: 3
} ] ];

module.exports = {
	entry: resolve(__dirname, "src/main.js"),
	output: {
		filename: "javascript/[name].[hash:8].js",
		chunkFilename: "javascript/[id].[chunkhash:8].js",
		path: resolve(__dirname, "dist"),
		publicPath: "/"
	},
	module: {
		rules: [{
			enforce: "pre",
			test: /\.(vue|m?js)$/i,
			loader: "eslint-loader",
			exclude: /(node_modules|bower_components)/,
			options: {
				emitError: true,
				emitWarning: true,
				failOnError: true,
				failOnWarning: true
			}
		}, {
			test: /\.vue$/i,
			loader: "vue-loader"
		}, {
			test: /\.m?js$/i,
			loader: "babel-loader",
			exclude: /(node_modules|bower_components)/,
			options: {
				comments: false,
				minified: true,
				plugins: BABEL_PLUGINS,
				presets: BABEL_PRESETS
			}
		}, {
			test: /\.css$/i,
			use: [
				"vue-style-loader",
				{
					loader: "css-loader",
					options: {
						esModule: false,
						importLoaders: 1
						// 0 => no loaders (default);
						// 1 => postcss-loader;
					}
				},
				"postcss-loader"
			]
		}, {
			test: /\.scss$/i,
			use: [
				"vue-style-loader",
				{
					loader: "css-loader",
					options: {
						esModule: false,
						importLoaders: 2
						// 0 => no loaders (default);
						// 1 => postcss-loader;
						// 2 => postcss-loader, sass-loader
					}
				},
				"postcss-loader",
				{
					loader: "sass-loader",
					options: {
						sassOptions: {
							outputStyle: "compressed"
						}
					}
				}
			]
		}, {
			test: /\.sass$/i,
			use: [
				"vue-style-loader",
				{
					loader: "css-loader",
					options: {
						esModule: false,
						importLoaders: 2
						// 0 => no loaders (default);
						// 1 => postcss-loader;
						// 2 => postcss-loader, sass-loader
					}
				},
				"postcss-loader",
				{
					loader: "sass-loader",
					options: {
						sassOptions: {
							indentedSyntax: true,
							outputStyle: "compressed"
						}
					}
				}
			]
		}, {
			test: /\.svg(\?.*)?$/i,
			use: [{
				loader: "file-loader",
				options: {
					name: "images/[name].[hash:8].[ext]",
					esModule: false
				}
			}, {
				loader: "svgo-loader",
				options: {
					plugins: [{
						removeViewBox: false
					}]
				}
			}]
		}, {
			test: /\.(png|jpe?g|webp|gif|ico)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "images/[name].[hash:8].[ext]",
				esModule: false
			}
		}, {
			test: /\.(mp4|webm|ogg|mp3|aac|wav|flac)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "media/[name].[hash:8].[ext]",
				esModule: false
			}
		}, {
			test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "fonts/[name].[hash:8].[ext]",
				esModule: false
			}
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [{
				from: "src/.ht*",
				to: "[name].[ext]"
			}]
		}),
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: resolve(__dirname, "src/index.html"),
			inject: true,
			favicon: resolve(__dirname, "src/favicon.ico"),
			minify: {
				collapseInlineTagWhitespace: true,
				collapseWhitespace: true,
				html5: true,
				keepClosingSlash: true,
				removeComments: true
			},
			xhtml: true
		})
	],
	resolve: {
		extensions: [ ".vue", ".js", ".mjs", ".json" ],
		alias: {
			"vue$": "vue/dist/vue.esm.js",
			"@": resolve(__dirname, "src")
		}
	},
	devServer: {
		contentBase: __dirname,
		historyApiFallback: true,
		hot: true,
		inline: true,
		open: true,
		overlay: {
			errors: true,
			warnings: true
		},
		stats: "minimal"
	}
};
