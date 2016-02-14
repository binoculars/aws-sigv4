'use strict';

/*eslint-env node, mocha */

import lint from 'mocha-eslint';
import * as assert from 'assert';
import * as path from 'path';
import 'babel-polyfill';
import * as Promise from 'bluebird';
import * as sigv4 from '../src/index.es6';
import * as fsCallback from 'fs';

const fs = Promise.promisifyAll(fsCallback);

/**
 * Mocha ESLint
 */
lint(['**/*.es6']);

/**
 * Tests from the AWS Documentation
 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
 */
describe('Signing AWS Requests', () => {
	let signedHeaders = 'content-type;host;x-amz-date';
	let requestPayload = 'Action=ListUsers&Version=2010-05-08';
	let hashedCanonicalRequest = '3511de7e95d28ecd39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
	 */
	describe('Task 1: Create a Canonical Request', () => {
		it('should match the hashed payload', () => {
			assert.strictEqual(
				sigv4.hash(requestPayload),
				'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2'
			);
		});

		let canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' +
			'mazonaws.com\nx-amz-date:20110909T233600Z\n\ncontent-type;host;x-amz-date\nb6359072c78d70ebee1e81adc' +
			'bab4f01bf2c23245fa365ef83fe8f1f955085e2';

		it('should match the sample canonical form', () => {
			assert.strictEqual(
				sigv4.canonicalRequest(
					'POST',
					'/',
					'',
					'content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.amazonaws.com\nx-amz' +
						'-date:20110909T233600Z',
					signedHeaders,
					requestPayload
				),
				canonicalForm
			);
		});

		it('should match the sample hashed canonical request', () => {
			assert.strictEqual(
				sigv4.hash(canonicalForm),
				hashedCanonicalRequest
			);
		});
	});

	let algorithm = 'AWS4-HMAC-SHA256';
	let credentialScope = '20110909/us-east-1/iam/aws4_request';
	let stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' +
		'39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
	 */
	describe('Task 2: Create a String to Sign', () => {
		it('should match the sample string to sign', () => {
			assert.strictEqual(
				sigv4.stringToSign(
					algorithm,
					'20110909T233600Z',
					credentialScope,
					hashedCanonicalRequest
				),
				stringToSign
			);
		});
	});

	let signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
	 */
	describe('Task 3: Calculate the Signature', () => {
		it('should match the hex signature', () => {
			assert.strictEqual(
				sigv4.sign(
					'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
					'20110909',
					'us-east-1',
					'iam',
					stringToSign
				),
				signature
			);
		});
	});

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
	 */
	describe('Task 4: Add the Signing Information to the Request', () => {
		let accessKeyId = 'AKIDEXAMPLE';

		it('should match the authorization', () => {
			assert.strictEqual(
				sigv4.authorization(
					algorithm,
					accessKeyId,
					credentialScope,
					signedHeaders,
					signature
				),
				'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=conte' +
					'nt-type;host;x-amz-date, Signature=ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174' +
					'deb456c'
			);
		});

		it('should match the query string', () => {
			assert.strictEqual(
				sigv4.querystringify(
					'Action=CreateUser&UserName=NewUser&Version=2010-05-08&',
					algorithm,
					accessKeyId,
					'20140611/us-east-1/iam/aws4_request',
					'20140611T231318Z',
					'30',
					'host',
					signature
				),
				'Action=CreateUser&UserName=NewUser&Version=2010-05-08&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Cre' +
					'dential=AKIDEXAMPLE%2F20140611%2Fus-east-1%2Fiam%2Faws4_request&X-Amz-Date=20140611T231318Z&' +
					'X-Amz-Expires=30&X-Amz-SignedHeaders=host&X-Amz-Signature=ced6826de92d2bdeed8f846f0bf508e855' +
					'9e98e4b0199114b84c54174deb456c'
			);
		});
	});
});

/**
 * AWS Signature Version 4 Test Suite
 * Implements https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
 */
let suiteDir = path.join(__dirname, 'fixtures/aws4_testsuite/');

fs.readdirAsync(suiteDir).then(files => {
	let algorithm = 'AWS4-HMAC-SHA256';
	let accessKeyId = 'AKIDEXAMPLE';
	let requestDate = sigv4.formatDateTime(new Date('Mon, 09 Sep 2011 23:36:00 GMT'));
	let credentialScope = '20110909/us-east-1/host/aws4_request';
	let secretAccessKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
	let groups = files
		.filter(file => file.slice(-5) === '.sreq')
		.map(file => file.slice(0, -5));

	groups.forEach(group => {
		describe('Test Suite: ' + group, () => {
			let request,
				canonicalRequest,
				stringToSign,
				authorizationHeader,
				signedRequest;

			before(done => {
				let files = [
					'req',   // <file-name>.req—the web request to be signed.
					'creq',  // <file-name>.creq—the resulting canonical request.
					'sts',   // <file-name>.sts—the resulting string to sign.
					'authz', // <file-name>.authz—the Authorization header.
					'sreq'   // <file-name>.sreq— the signed request.
				].map(ext => fs.readFileAsync(path.join(suiteDir, group + '.' + ext), 'utf8'));

				Promise.settle(files).then(results => {
					[
						request,
						canonicalRequest,
						stringToSign,
						authorizationHeader,
						signedRequest
					] = results.map(r => r.value());

					canonicalRequest = canonicalRequest.replace(/\r/g, '');
					stringToSign = stringToSign.replace(/\r/g, '');

					done();
				});
			});

			describe('Task 1: Create a Canonical Request for Signature Version 4', () => {
				it('should match the canonical request', () => {
					assert.strictEqual(
						sigv4.requestToCanonicalRequest(request),
						canonicalRequest
					);
				});
			});

			describe('Task 2: Create a String to Sign for Signature Version 4', () => {
				it('should match the string to sign', () => {
					assert.strictEqual(
						sigv4.stringToSign(
							algorithm,
							requestDate,
							credentialScope,
							sigv4.hash(canonicalRequest)
						),
						stringToSign
					);
				});
			});

			describe('Task 3: Calculate the AWS Signature Version 4', () => {
				it('should match the authorization header value', () => {
					let signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];
					let signature = sigv4.sign(
						secretAccessKey,
						requestDate.slice(0, 8),
						'us-east-1',
						'host',
						stringToSign
					);

					assert.strictEqual(
						sigv4.authorization(
							algorithm,
							accessKeyId,
							credentialScope,
							signedHeaders,
							signature
						),
						authorizationHeader
					);
				});
			});

			describe('The Signed Request', () => {
				it('should match the signed request value', () => {
					assert.strictEqual(
						sigv4.addAuthorization(request, authorizationHeader),
						signedRequest
					);
				});
			});
		});
	});
});