#!/usr/bin/env node

'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');
const unzip = require('unzip');
const url = require('url');

const fixturesDir = path.join(__dirname, '..', 'test', 'fixtures');

function promisify(func) {
	return function() {
		const args = [].slice.call(arguments);

		return new Promise((resolve, reject) => {
			args.push((err, data) =>
				err ? reject(err) : resolve(data)
			);

			func.apply(this, args);
		});
	}
}

const exists = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

function request(options) {
	return new Promise((resolve, reject) => {
		const req = https.request(options, res => {
			let body = '';
			res.on('data', chunk => body += chunk);
			res.on('end', () => resolve(
				Object.assign(res, {body})
			));
		});

		req.on('error', reject);
		req.end();
	});
}

function getRemoteETag(parsedUrl) {
	const options = Object.assign(
		{
			method: 'HEAD'
		},
		parsedUrl
	);

	return request(options)
		.then(res => res.headers.etag);
}

function downloadAndUnzipFile(parsedUrl, path) {
	return new Promise((resolve, reject) => {
		const req = https.request(parsedUrl, res => {
			res.pipe(unzip.Extract({path}));
			res.on('end', () => resolve(res));
		});

		req.on('error', reject);
		req.end();
	});
}

const fixtureName = 'aws4_testsuite';
const fixtureURL = 'https://docs.aws.amazon.com/general/latest/gr/samples/aws4_testsuite.zip';

const fixtureDir = path.join(fixturesDir, fixtureName);
const fixtureEtagFile = path.join(fixturesDir, `${fixtureName}.ETag`);
const fixtureUrlParsed = url.parse(fixtureURL);

const files = [
	fixtureDir,
	fixtureEtagFile
];

return Promise.all(files.map(file => exists(file)))
	.catch(() => Promise.reject('ETag or Fixtures directory does not exist'))
	.then(() => Promise.all([
		readFile(fixtureEtagFile, {encoding: 'utf8'}),
		getRemoteETag(fixtureUrlParsed)
	]))
	.then(arr => arr[0] !== arr[1] ?
		Promise.reject('Invalid cached ETag') :
		'Valid ETag, using cached version'
	)
	.then(console.log)
	.catch(err => {
		console.error(`${err}, downloading new version`);
		return Promise.all(files.map(file => unlink(file)))
			.catch(() => {})
			.then(() => downloadAndUnzipFile(fixtureUrlParsed, fixtureDir))
			.then(res => writeFile(fixtureEtagFile, res.headers.etag));
	});