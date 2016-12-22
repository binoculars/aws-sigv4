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
			libraryTarget: target === 'node' ? 'commonjs' : 'umd',
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
							'es2015-node4',
							'babili'
						],
						compact: true,
						comments: false,
						minified: true
					},
					// options for the loader
				}
			]
		},

		resolve: {
			extensions: ['.js'],

			alias: {
				'deps$': path.resolve(__dirname, `src/${target}-deps.js`),
			},
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
		]
	}
}

module.exports = [
	'node',
	'web'
].map(config);