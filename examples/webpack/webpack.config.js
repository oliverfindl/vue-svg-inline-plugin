"use strict";

const { resolve } = require("path");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	mode: process.env.NODE_ENV,
	target: "web",
	entry: resolve(__dirname, "src/main.js"),
	output: {
		path: resolve(__dirname, "dist"),
		publicPath: "/",
		filename: "javascript/[name].[hash:8].js",
		chunkFilename: "javascript/[id].[chunkhash:8].js"
	},
	devServer: {
		historyApiFallback: true,
		overlay: {
			errors: true,
			warnings: true
		}
	},
	performance: {
		hints: false
	},
	module: {
		rules: [{
			enforce: "pre",
			test: /\.(vue|m?js)$/i,
			exclude: /(node_modules|bower_components)/,
			loader: "eslint-loader",
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
				plugins: ["@babel/plugin-syntax-dynamic-import"],
				presets: [["@babel/preset-env", {
					useBuiltIns: "usage",
					corejs: 3
				}]]
			}
		}, {
			test: /\.css$/i,
			use: [
				"vue-style-loader",
				"css-loader",
				"postcss-loader"
			]
		}, {
			test: /\.scss$/i,
			use: [
				"vue-style-loader",
				"css-loader",
				{
					loader: "sass-loader",
					options: {
						sassOptions: {
							outputStyle: "compressed"
						}
					}
				},
				"postcss-loader"
			]
		}, {
			test: /\.sass$/i,
			use: [
				"vue-style-loader",
				"css-loader",
				{
					loader: "sass-loader",
					options: {
						sassOptions: {
							indentedSyntax: true,
							outputStyle: "compressed"
						}
					}
				},
				"postcss-loader"
			]
		}, {
			test: /\.svg(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "images/[name].[ext]"
			}
		}, {
			test: /\.(png|jpe?g|gif|ico)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "images/[name].[hash:8].[ext]"
			}
		}, {
			test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name: "media/[name].[hash:8].[ext]"
			}
		}, {
			test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
			loader: "file-loader",
			options: {
				name:"fonts/[name].[hash:8].[ext]"
			}
		}]
	},
	plugins: [
		new VueLoaderPlugin(),
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin([{
			from: "src/.ht*",
			to: "[name].[ext]"
		}]),
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "src/index.html",
			inject: true,
			favicon: "src/favicon.ico",
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
		extensions: [".vue", ".js", ".json"],
		alias: {
			"vue$": "vue/dist/vue.esm.js",
			"@": resolve(__dirname, "src")
		}
	}
};
