const webpack = require('webpack');
const path = require('path');

function config(target) {
	return {
		entry: [
			// 'babel-polyfill',
			'./src/index.js'
		],

		output: {
			path: path.resolve(__dirname, 'lib', target), // string
			filename: 'index.js', // string
			library: 'sigv4', // string,
			//libraryTarget: target === 'node' ? 'commonjs' : 'umd',
			libraryTarget: 'umd',
		},

		module: {
			// configuration regarding modules

			rules: [
				// rules for modules (configure loaders, parser options, etc.)

				{
					test: /\.js?$/,
					include: [
						path.resolve(__dirname, 'src')
					],
					loader: 'babel-loader',
					options: {
						presets: [
							'es2015-node4',
							// 'babili'
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

		devtool: 'source-map', // enum
		context: __dirname, // string (absolute path!)
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