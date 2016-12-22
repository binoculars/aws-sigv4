'use strict';

/*eslint-env node, mocha */

import lint from 'mocha-eslint';
import * as assert from 'assert';
import {join} from 'path';
import sigv4 from 'aws-sigv4';
import * as fs from 'fs';
import * as parsing from './parsing.js';

/**
 * Mocha ESLint
 */
lint([
	'src/*.js',
	'test/*.js'
]);

/**
 * Tests from the AWS Documentation
 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
 */
describe('Signing AWS Requests', () => {
	const signedHeaders = 'content-type;host;x-amz-date';
	const requestPayload = 'Action=ListUsers&Version=2010-05-08';
	const hashedCanonicalRequest = '3511de7e95d28ecd39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
	 */
	describe('Task 1: Create a Canonical Request', () => {
		it('should match the hashed payload', () => sigv4.hash(requestPayload)
			.then(result => assert
				.strictEqual(
					result,
					'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2'
				)
			)
		);

		const canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' +
			'mazonaws.com\nx-amz-date:20110909T233600Z\n\ncontent-type;host;x-amz-date\nb6359072c78d70ebee1e81adc' +
			'bab4f01bf2c23245fa365ef83fe8f1f955085e2';
		const args = [
			'POST',
			'/',
			'',
			'content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.amazonaws.com\nx-amz' +
			'-date:20110909T233600Z',
			signedHeaders,
			requestPayload
		];

		it('should match the sample canonical form', () => sigv4.buildCanonicalRequest(...args)
			.then(result => assert
				.strictEqual(
					result,
					canonicalForm
				)
			)
		);

		it('should match the sample hashed canonical request', () => sigv4.hash(canonicalForm)
			.then(result => assert
				.strictEqual(
					result,
					hashedCanonicalRequest
				)
			)
		);
	});

	const credentialScope = '20110909/us-east-1/iam/aws4_request';
	const stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' +
		'39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
	 */
	describe('Task 2: Create a String to Sign', () => {
		it('should match the sample string to sign', () => {
			assert.strictEqual(
				sigv4.buildStringToSign(
					'20110909T233600Z',
					credentialScope,
					hashedCanonicalRequest
				),
				stringToSign
			);
		});
	});

	const signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
	 */
	describe('Task 3: Calculate the Signature', () => {
		const args = [
			'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
			'20110909',
			'us-east-1',
			'iam',
			stringToSign
		];

		it('should match the hex signature', () => sigv4.sign(...args)
			.then(result => assert
				.strictEqual(
					result,
					signature
				)
			)
		);
	});

	/**
	 * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
	 */
	describe('Task 4: Add the Signing Information to the Request', () => {
		const accessKeyId = 'AKIDEXAMPLE';

		it('should match the authorization', () => {
			assert.strictEqual(
				sigv4.buildAuthorization(
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
				parsing.querystringify(
					'Action=CreateUser&UserName=NewUser&Version=2010-05-08&',
					'AWS4-HMAC-SHA256',
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

const suiteFileExtensions = [
	'req',   // <file-name>.req—the web request to be signed.
	'creq',  // <file-name>.creq—the resulting canonical request.
	'sts',   // <file-name>.sts—the resulting string to sign.
	'authz', // <file-name>.authz—the Authorization header.
	'sreq'   // <file-name>.sreq— the signed request.
];

function getTestFiles(array, name, directory) {
	const testFiles = {};
	const files = fs.readdirSync(directory)

	for (const file of files) {
		const fullPath = join(directory, file);

		if (fs.lstatSync(fullPath).isDirectory()) {
			getTestFiles(array, file, fullPath);
		} else {
			const ext = file.split('.')[1];

			if (ext && suiteFileExtensions.includes(ext)) {
				testFiles[ext] = fullPath;
			}
		}
	}

	if (Object.keys(testFiles).length === suiteFileExtensions.length) {
		testFiles.name = name;
		array.push(testFiles);
	}
}

/**
 * AWS Signature Version 4 Test Suite
 * Implements https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
 */
{
	const algorithm = 'AWS4-HMAC-SHA256';
	const accessKeyId = 'AKIDEXAMPLE';
	const requestDate = sigv4.formatDateTime(new Date('Sun, 30 Aug 2015 12:36:00 GMT'));
	const credentialScope = '20150830/us-east-1/service/aws4_request';
	const secretAccessKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
	const securityToken = 'AQoDYXdzEPT//////////wEXAMPLEtc764bNrC9SAPBSM22wDOk4x4HIZ8j4FZTwdQWLWsKWHGBuFqwAeMicRXmx' +
		'fpSPfIeoIYRqTflfKD8YUuwthAx7mSEI/qkPpKPi/kMcGdQrmGdeehM4IC1NtBmUpp2wUE8phUZampKsburEDy0KPkyQDYwT7WZ0wq5V' +
		'SXDvp75YU9HFvlRd8Tx6q6fE8YQcHNVXAkiY9q6d+xo0rKwT38xVqr7ZD0u0iPPkUL64lIZbqBAz+scqKmlzm8FDrypNC9Yjc8fPOLn9' +
		'FX9KSYvKTr4rvx3iSIlTJabIQwj2ICCR/oLxBA==';
	const groups = [];

	getTestFiles(groups, '', join(__dirname, 'fixtures/aws4_testsuite/'));

	for (const group of groups) {
		describe('Test Suite: ' + group.name, () => {
			let request,
				canonicalRequest,
				stringToSign,
				authorizationHeader,
				signedRequest;

			before(() => {
				[
					request,
					canonicalRequest,
					stringToSign,
					authorizationHeader,
					signedRequest
				] = suiteFileExtensions.map(ext => fs.readFileSync(group[ext], 'utf8'));
			});

			describe('Task 1: Create a Canonical Request for Signature Version 4', () => {
				it('should match the canonical request', () => parsing.requestToCanonicalRequest(request)
					.then(result => assert
						.strictEqual(
							result,
							canonicalRequest
						)
					)
				);
			});

			describe('Task 2: Create a String to Sign for Signature Version 4', () => {
				it('should match the string to sign', () => sigv4.hash(canonicalRequest)
					.then(hashedCanonicalRequest => assert
						.strictEqual(
							sigv4.buildStringToSign(
								requestDate,
								credentialScope,
								hashedCanonicalRequest
							),
							stringToSign
						)
					)
				);
			});

			describe('Task 3: Calculate the AWS Signature Version 4', () => {
				it('should match the authorization header value', () => {
					const signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];

					return sigv4.sign(
						secretAccessKey,
						requestDate.slice(0, 8),
						'us-east-1',
						'service',
						stringToSign
					)
						.then(signature => assert.strictEqual(
							sigv4.buildAuthorization(
								accessKeyId,
								credentialScope,
								signedHeaders,
								signature
							),
							authorizationHeader
						)
					)
				});
			});

			describe('The Signed Request', () => {
				it('should match the signed request value', () => {
					const args = [
						request,
						authorizationHeader
					];

					// Special case
					if (group.name === 'post-sts-header-after') {
						args.push(securityToken)
					}

					assert.strictEqual(
						parsing.addAuthorization(...args),
						signedRequest
					);
				});
			});
		});
	}
}