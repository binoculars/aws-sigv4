const webpack = require('webpack');
const path = require('path');

function config(target) {
	return {
		entry: [
			'./src/index.js'
		],

		output: {
			path: path.resolve(__dirname, 'lib', target),
			filename: 'index.js', // string
			library: target === 'node' ? undefined : 'sigv4',
			libraryTarget: target === 'node' ? 'commonjs' : 'umd'
		},

		module: {

			rules: [
				{
					test: /\.js?$/,
					include: [
						path.resolve(__dirname, 'src')
					],
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'env',
								{
									targets: {
										node: 6
									}
								}
							]
						],
						compact: true,
						comments: false,
						minified: true
					}
					// options for the loader
				}
			]
		},

		resolve: {
			extensions: ['.js'],

			alias: {
				'deps$': path.resolve(__dirname, `src/${target}-deps.js`)
			}
		},

		devtool: 'source-map',
		context: __dirname,
		target,

		stats: {
			/* TODO */
		},

		devServer: {
			/* TODO */
		},

		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			})
		]
	}
}

module.exports = [
	'node',
	'web'
].map(config);