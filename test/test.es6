'use strict';

/*eslint-env node, mocha */

import lint from 'mocha-eslint';
import * as assert from 'assert';
import {join} from 'path';
import * as sigv4 from '../src/index.es6';
import * as fs from 'fs';

/**
 * Mocha ESLint
 */
lint(['**/*.es6']);

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
		it('should match the hashed payload', () => {
			assert.strictEqual(
				sigv4.hash(requestPayload),
				'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2'
			);
		});

		const canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' +
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

	const algorithm = 'AWS4-HMAC-SHA256';
	const credentialScope = '20110909/us-east-1/iam/aws4_request';
	const stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' +
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

	const signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

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
		const accessKeyId = 'AKIDEXAMPLE';

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

const suiteFileExtensions = [
	'req',   // <file-name>.req—the web request to be signed.
	'creq',  // <file-name>.creq—the resulting canonical request.
	'sts',   // <file-name>.sts—the resulting string to sign.
	'authz', // <file-name>.authz—the Authorization header.
	'sreq'   // <file-name>.sreq— the signed request.
];

function getTestFiles(array, name, directory) {
	const testFiles = {};

	fs.readdirSync(directory).forEach(file => {
		const fullPath = join(directory, file);

		if (fs.lstatSync(fullPath).isDirectory()) {
			getTestFiles(array, file, fullPath);
		} else {
			const ext = file.split('.')[1];

			if (ext && ~suiteFileExtensions.indexOf(ext)) {
				testFiles[ext] = fullPath;
			}
		}
	});

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

	groups.forEach(group => {
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
					const signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];
					const signature = sigv4.sign(
						secretAccessKey,
						requestDate.slice(0, 8),
						'us-east-1',
						'service',
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
					if (group.name === 'post-sts-header-after') {
						// Special case
						assert.strictEqual(
							sigv4.addAuthorization(request, authorizationHeader, securityToken),
							signedRequest
						);
					} else {
						assert.strictEqual(
							sigv4.addAuthorization(request, authorizationHeader),
							signedRequest
						);
					}
				});
			});
		});
	});
}