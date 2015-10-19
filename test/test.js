'use strict';

/*eslint-env node, mocha */

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('babel/register');

var _mochaEslint = require('mocha-eslint');

var _mochaEslint2 = _interopRequireDefault(_mochaEslint);

var _assert = require('assert');

var assert = _interopRequireWildcard(_assert);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _srcIndexEs6 = require('../src/index.es6');

var sigv4 = _interopRequireWildcard(_srcIndexEs6);

var fs = Promise.promisifyAll(require('fs'));

/**
 * Mocha ESLint
 */
{
	(0, _mochaEslint2['default'])(['**/*.es6']);
}

/**
 * Tests from the AWS Documentation
 */
{
	/**
  * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
  */
	describe('Signing AWS Requests', function () {
		var signedHeaders = 'content-type;host;x-amz-date';
		var requestPayload = 'Action=ListUsers&Version=2010-05-08';
		var hashedCanonicalRequest = '3511de7e95d28ecd39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
   */
		describe('Task 1: Create a Canonical Request', function () {
			it('should match the hashed payload', function () {
				assert.strictEqual(sigv4.hash(requestPayload), 'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2');
			});

			var canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' + 'mazonaws.com\nx-amz-date:20110909T233600Z\n\ncontent-type;host;x-amz-date\nb6359072c78d70ebee1e81adc' + 'bab4f01bf2c23245fa365ef83fe8f1f955085e2';

			it('should match the sample canonical form', function () {
				assert.strictEqual(sigv4.canonicalRequest('POST', '/', '', 'content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.amazonaws.com\nx-amz' + '-date:20110909T233600Z', signedHeaders, requestPayload), canonicalForm);
			});

			it('should match the sample hashed canonical request', function () {
				assert.strictEqual(sigv4.hash(canonicalForm), hashedCanonicalRequest);
			});
		});

		var algorithm = 'AWS4-HMAC-SHA256';
		var credentialScope = '20110909/us-east-1/iam/aws4_request';
		var stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' + '39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
   */
		describe('Task 2: Create a String to Sign', function () {
			it('should match the sample string to sign', function () {
				assert.strictEqual(sigv4.stringToSign(algorithm, '20110909T233600Z', credentialScope, hashedCanonicalRequest), stringToSign);
			});
		});

		var signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
   */
		describe('Task 3: Calculate the Signature', function () {
			it('should match the hex signature', function () {
				assert.strictEqual(sigv4.sign('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', '20110909', 'us-east-1', 'iam', stringToSign), signature);
			});
		});

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
   */
		describe('Task 4: Add the Signing Information to the Request', function () {
			var accessKeyId = 'AKIDEXAMPLE';

			it('should match the authorization', function () {
				assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), 'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=conte' + 'nt-type;host;x-amz-date, Signature=ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174' + 'deb456c');
			});

			it('should match the query string', function () {
				assert.strictEqual(sigv4.querystringify('Action=CreateUser&UserName=NewUser&Version=2010-05-08&', algorithm, accessKeyId, '20140611/us-east-1/iam/aws4_request', '20140611T231318Z', '30', 'host', signature), 'Action=CreateUser&UserName=NewUser&Version=2010-05-08&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Cre' + 'dential=AKIDEXAMPLE%2F20140611%2Fus-east-1%2Fiam%2Faws4_request&X-Amz-Date=20140611T231318Z&' + 'X-Amz-Expires=30&X-Amz-SignedHeaders=host&X-Amz-Signature=ced6826de92d2bdeed8f846f0bf508e855' + '9e98e4b0199114b84c54174deb456c');
			});
		});
	});
}

/**
 * AWS Signature Version 4 Test Suite
 */
{
	(function () {
		var algorithm = 'AWS4-HMAC-SHA256';
		var accessKeyId = 'AKIDEXAMPLE';
		var requestDate = sigv4.formatDateTime(new Date('Mon, 09 Sep 2011 23:36:00 GMT'));
		var credentialScope = '20110909/us-east-1/host/aws4_request';
		var secretAccessKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
		var suiteDir = path.join(__dirname, 'fixtures/aws4_testsuite/');

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
   */
		fs.readdirAsync(suiteDir).then(function (files) {
			var groups = files.filter(function (file) {
				return file.slice(-5) === '.sreq';
			}).map(function (file) {
				return file.slice(0, -5);
			});

			groups.forEach(function (group) {
				describe('Test Suite: ' + group, function () {
					var request = undefined,
					    canonicalRequest = undefined,
					    stringToSign = undefined,
					    authorizationHeader = undefined,
					    signedRequest = undefined;

					before(function (done) {
						var files = ['req', // <file-name>.req—the web request to be signed.
						'creq', // <file-name>.creq—the resulting canonical request.
						'sts', // <file-name>.sts—the resulting string to sign.
						'authz', // <file-name>.authz—the Authorization header.
						'sreq' // <file-name>.sreq— the signed request.
						].map(function (ext) {
							return fs.readFileAsync(path.join(suiteDir, group + '.' + ext), 'utf8');
						});

						Promise.settle(files).then(function (results) {
							var _results$map = results.map(function (r) {
								return r.value();
							});

							var _results$map2 = _slicedToArray(_results$map, 5);

							request = _results$map2[0];
							canonicalRequest = _results$map2[1];
							stringToSign = _results$map2[2];
							authorizationHeader = _results$map2[3];
							signedRequest = _results$map2[4];

							canonicalRequest = canonicalRequest.replace(/\r/g, '');
							stringToSign = stringToSign.replace(/\r/g, '');

							done();
						});
					});

					describe('Task 1: Create a Canonical Request for Signature Version 4', function () {
						it('should match the canonical request', function () {
							assert.strictEqual(sigv4.requestToCanonicalRequest(request), canonicalRequest);
						});
					});

					describe('Task 2: Create a String to Sign for Signature Version 4', function () {
						it('should match the string to sign', function () {
							assert.strictEqual(sigv4.stringToSign(algorithm, requestDate, credentialScope, sigv4.hash(canonicalRequest)), stringToSign);
						});
					});

					describe('Task 3: Calculate the AWS Signature Version 4', function () {
						it('should match the authorization header value', function () {
							var signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];
							var signature = sigv4.sign(secretAccessKey, requestDate.slice(0, 8), 'us-east-1', 'host', stringToSign);

							assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), authorizationHeader);
						});
					});

					describe('The Signed Request', function () {
						it('should match the signed request value', function () {
							assert.strictEqual(sigv4.addAuthorization(request, authorizationHeader), signedRequest);
						});
					});
				});
			});
		});
	})();
}
'use strict';

/*eslint-env node, mocha */

var _slicedToArray = (function () {
	function sliceIterator(arr, i) {
		var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
			for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
				_arr.push(_s.value);if (i && _arr.length === i) break;
			}
		} catch (err) {
			_d = true;_e = err;
		} finally {
			try {
				if (!_n && _i['return']) _i['return']();
			} finally {
				if (_d) throw _e;
			}
		}return _arr;
	}return function (arr, i) {
		if (Array.isArray(arr)) {
			return arr;
		} else if (Symbol.iterator in Object(arr)) {
			return sliceIterator(arr, i);
		} else {
			throw new TypeError('Invalid attempt to destructure non-iterable instance');
		}
	};
})();

function _interopRequireWildcard(obj) {
	if (obj && obj.__esModule) {
		return obj;
	} else {
		var newObj = {};if (obj != null) {
			for (var key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
			}
		}newObj['default'] = obj;return newObj;
	}
}

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { 'default': obj };
}

require('babel/register');

var _mochaEslint = require('mocha-eslint');

var _mochaEslint2 = _interopRequireDefault(_mochaEslint);

var _assert = require('assert');

var assert = _interopRequireWildcard(_assert);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _srcIndexEs6 = require('../src/index.es6');

var sigv4 = _interopRequireWildcard(_srcIndexEs6);

var fs = Promise.promisifyAll(require('fs'));

/**
 * Mocha ESLint
 */
{
	(0, _mochaEslint2['default'])(['**/*.es6']);
}

/**
 * Tests from the AWS Documentation
 */
{
	/**
  * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
  */
	describe('Signing AWS Requests', function () {
		var signedHeaders = 'content-type;host;x-amz-date';
		var requestPayload = 'Action=ListUsers&Version=2010-05-08';
		var hashedCanonicalRequest = '3511de7e95d28ecd39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
   */
		describe('Task 1: Create a Canonical Request', function () {
			it('should match the hashed payload', function () {
				assert.strictEqual(sigv4.hash(requestPayload), 'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2');
			});

			var canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' + 'mazonaws.com\nx-amz-date:20110909T233600Z\n\ncontent-type;host;x-amz-date\nb6359072c78d70ebee1e81adc' + 'bab4f01bf2c23245fa365ef83fe8f1f955085e2';

			it('should match the sample canonical form', function () {
				assert.strictEqual(sigv4.canonicalRequest('POST', '/', '', 'content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.amazonaws.com\nx-amz' + '-date:20110909T233600Z', signedHeaders, requestPayload), canonicalForm);
			});

			it('should match the sample hashed canonical request', function () {
				assert.strictEqual(sigv4.hash(canonicalForm), hashedCanonicalRequest);
			});
		});

		var algorithm = 'AWS4-HMAC-SHA256';
		var credentialScope = '20110909/us-east-1/iam/aws4_request';
		var stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' + '39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
   */
		describe('Task 2: Create a String to Sign', function () {
			it('should match the sample string to sign', function () {
				assert.strictEqual(sigv4.stringToSign(algorithm, '20110909T233600Z', credentialScope, hashedCanonicalRequest), stringToSign);
			});
		});

		var signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
   */
		describe('Task 3: Calculate the Signature', function () {
			it('should match the hex signature', function () {
				assert.strictEqual(sigv4.sign('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', '20110909', 'us-east-1', 'iam', stringToSign), signature);
			});
		});

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
   */
		describe('Task 4: Add the Signing Information to the Request', function () {
			var accessKeyId = 'AKIDEXAMPLE';

			it('should match the authorization', function () {
				assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), 'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=conte' + 'nt-type;host;x-amz-date, Signature=ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174' + 'deb456c');
			});

			it('should match the query string', function () {
				assert.strictEqual(sigv4.querystringify('Action=CreateUser&UserName=NewUser&Version=2010-05-08&', algorithm, accessKeyId, '20140611/us-east-1/iam/aws4_request', '20140611T231318Z', '30', 'host', signature), 'Action=CreateUser&UserName=NewUser&Version=2010-05-08&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Cre' + 'dential=AKIDEXAMPLE%2F20140611%2Fus-east-1%2Fiam%2Faws4_request&X-Amz-Date=20140611T231318Z&' + 'X-Amz-Expires=30&X-Amz-SignedHeaders=host&X-Amz-Signature=ced6826de92d2bdeed8f846f0bf508e855' + '9e98e4b0199114b84c54174deb456c');
			});
		});
	});
}

/**
 * AWS Signature Version 4 Test Suite
 */
{
	(function () {
		var algorithm = 'AWS4-HMAC-SHA256';
		var accessKeyId = 'AKIDEXAMPLE';
		var requestDate = sigv4.formatDateTime(new Date('Mon, 09 Sep 2011 23:36:00 GMT'));
		var credentialScope = '20110909/us-east-1/host/aws4_request';
		var secretAccessKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
		var suiteDir = path.join(__dirname, 'fixtures/aws4_testsuite/');

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
   */
		fs.readdirAsync(suiteDir).then(function (files) {
			var groups = files.filter(function (file) {
				return file.slice(-5) === '.sreq';
			}).map(function (file) {
				return file.slice(0, -5);
			});

			groups.forEach(function (group) {
				describe('Test Suite: ' + group, function () {
					var request = undefined,
					    canonicalRequest = undefined,
					    stringToSign = undefined,
					    authorizationHeader = undefined,
					    signedRequest = undefined;

					before(function (done) {
						var files = ['req', // <file-name>.req—the web request to be signed.
						'creq', // <file-name>.creq—the resulting canonical request.
						'sts', // <file-name>.sts—the resulting string to sign.
						'authz', // <file-name>.authz—the Authorization header.
						'sreq' // <file-name>.sreq— the signed request.
						].map(function (ext) {
							return fs.readFileAsync(path.join(suiteDir, group + '.' + ext), 'utf8');
						});

						Promise.settle(files).then(function (results) {
							var _results$map = results.map(function (r) {
								return r.value();
							});

							var _results$map2 = _slicedToArray(_results$map, 5);

							request = _results$map2[0];
							canonicalRequest = _results$map2[1];
							stringToSign = _results$map2[2];
							authorizationHeader = _results$map2[3];
							signedRequest = _results$map2[4];

							canonicalRequest = canonicalRequest.replace(/\r/g, '');
							stringToSign = stringToSign.replace(/\r/g, '');

							done();
						});
					});

					describe('Task 1: Create a Canonical Request for Signature Version 4', function () {
						it('should match the canonical request', function () {
							assert.strictEqual(sigv4.requestToCanonicalRequest(request), canonicalRequest);
						});
					});

					describe('Task 2: Create a String to Sign for Signature Version 4', function () {
						it('should match the string to sign', function () {
							assert.strictEqual(sigv4.stringToSign(algorithm, requestDate, credentialScope, sigv4.hash(canonicalRequest)), stringToSign);
						});
					});

					describe('Task 3: Calculate the AWS Signature Version 4', function () {
						it('should match the authorization header value', function () {
							var signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];
							var signature = sigv4.sign(secretAccessKey, requestDate.slice(0, 8), 'us-east-1', 'host', stringToSign);

							assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), authorizationHeader);
						});
					});

					describe('The Signed Request', function () {
						it('should match the signed request value', function () {
							assert.strictEqual(sigv4.addAuthorization(request, authorizationHeader), signedRequest);
						});
					});
				});
			});
		});
	})();
}
'use strict';

/*eslint-env node, mocha */

var _slicedToArray = (function () {
	function sliceIterator(arr, i) {
		var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
			for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
				_arr.push(_s.value);if (i && _arr.length === i) break;
			}
		} catch (err) {
			_d = true;_e = err;
		} finally {
			try {
				if (!_n && _i['return']) _i['return']();
			} finally {
				if (_d) throw _e;
			}
		}return _arr;
	}return function (arr, i) {
		if (Array.isArray(arr)) {
			return arr;
		} else if (Symbol.iterator in Object(arr)) {
			return sliceIterator(arr, i);
		} else {
			throw new TypeError('Invalid attempt to destructure non-iterable instance');
		}
	};
})();

function _interopRequireWildcard(obj) {
	if (obj && obj.__esModule) {
		return obj;
	} else {
		var newObj = {};if (obj != null) {
			for (var key in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
			}
		}newObj['default'] = obj;return newObj;
	}
}

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { 'default': obj };
}

require('babel/register');

var _mochaEslint = require('mocha-eslint');

var _mochaEslint2 = _interopRequireDefault(_mochaEslint);

var _assert = require('assert');

var assert = _interopRequireWildcard(_assert);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _bluebird = require('bluebird');

var Promise = _interopRequireWildcard(_bluebird);

var _srcIndexEs6 = require('../src/index.es6');

var sigv4 = _interopRequireWildcard(_srcIndexEs6);

var fs = Promise.promisifyAll(require('fs'));

/**
 * Mocha ESLint
 */
{
	(0, _mochaEslint2['default'])(['**/*.es6']);
}

/**
 * Tests from the AWS Documentation
 */
{
	/**
  * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
  */
	describe('Signing AWS Requests', function () {
		var signedHeaders = 'content-type;host;x-amz-date';
		var requestPayload = 'Action=ListUsers&Version=2010-05-08';
		var hashedCanonicalRequest = '3511de7e95d28ecd39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
   */
		describe('Task 1: Create a Canonical Request', function () {
			it('should match the hashed payload', function () {
				assert.strictEqual(sigv4.hash(requestPayload), 'b6359072c78d70ebee1e81adcbab4f01bf2c23245fa365ef83fe8f1f955085e2');
			});

			var canonicalForm = 'POST\n/\n\ncontent-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.a' + 'mazonaws.com\nx-amz-date:20110909T233600Z\n\ncontent-type;host;x-amz-date\nb6359072c78d70ebee1e81adc' + 'bab4f01bf2c23245fa365ef83fe8f1f955085e2';

			it('should match the sample canonical form', function () {
				assert.strictEqual(sigv4.canonicalRequest('POST', '/', '', 'content-type:application/x-www-form-urlencoded; charset=utf-8\nhost:iam.amazonaws.com\nx-amz' + '-date:20110909T233600Z', signedHeaders, requestPayload), canonicalForm);
			});

			it('should match the sample hashed canonical request', function () {
				assert.strictEqual(sigv4.hash(canonicalForm), hashedCanonicalRequest);
			});
		});

		var algorithm = 'AWS4-HMAC-SHA256';
		var credentialScope = '20110909/us-east-1/iam/aws4_request';
		var stringToSign = 'AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/iam/aws4_request\n3511de7e95d28ecd' + '39e9513b642aee07e54f4941150d8df8bf94b328ef7e55e2';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
   */
		describe('Task 2: Create a String to Sign', function () {
			it('should match the sample string to sign', function () {
				assert.strictEqual(sigv4.stringToSign(algorithm, '20110909T233600Z', credentialScope, hashedCanonicalRequest), stringToSign);
			});
		});

		var signature = 'ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174deb456c';

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
   */
		describe('Task 3: Calculate the Signature', function () {
			it('should match the hex signature', function () {
				assert.strictEqual(sigv4.sign('wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', '20110909', 'us-east-1', 'iam', stringToSign), signature);
			});
		});

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
   */
		describe('Task 4: Add the Signing Information to the Request', function () {
			var accessKeyId = 'AKIDEXAMPLE';

			it('should match the authorization', function () {
				assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), 'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=conte' + 'nt-type;host;x-amz-date, Signature=ced6826de92d2bdeed8f846f0bf508e8559e98e4b0199114b84c54174' + 'deb456c');
			});

			it('should match the query string', function () {
				assert.strictEqual(sigv4.querystringify('Action=CreateUser&UserName=NewUser&Version=2010-05-08&', algorithm, accessKeyId, '20140611/us-east-1/iam/aws4_request', '20140611T231318Z', '30', 'host', signature), 'Action=CreateUser&UserName=NewUser&Version=2010-05-08&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Cre' + 'dential=AKIDEXAMPLE%2F20140611%2Fus-east-1%2Fiam%2Faws4_request&X-Amz-Date=20140611T231318Z&' + 'X-Amz-Expires=30&X-Amz-SignedHeaders=host&X-Amz-Signature=ced6826de92d2bdeed8f846f0bf508e855' + '9e98e4b0199114b84c54174deb456c');
			});
		});
	});
}

/**
 * AWS Signature Version 4 Test Suite
 */
{
	(function () {
		var algorithm = 'AWS4-HMAC-SHA256';
		var accessKeyId = 'AKIDEXAMPLE';
		var requestDate = sigv4.formatDateTime(new Date('Mon, 09 Sep 2011 23:36:00 GMT'));
		var credentialScope = '20110909/us-east-1/host/aws4_request';
		var secretAccessKey = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
		var suiteDir = path.join(__dirname, 'fixtures/aws4_testsuite/');

		/**
   * Implements https://docs.aws.amazon.com/general/latest/gr/signature-v4-test-suite.html
   */
		fs.readdirAsync(suiteDir).then(function (files) {
			var groups = files.filter(function (file) {
				return file.slice(-5) === '.sreq';
			}).map(function (file) {
				return file.slice(0, -5);
			});

			groups.forEach(function (group) {
				describe('Test Suite: ' + group, function () {
					var request = undefined,
					    canonicalRequest = undefined,
					    stringToSign = undefined,
					    authorizationHeader = undefined,
					    signedRequest = undefined;

					before(function (done) {
						var files = ['req', // <file-name>.req—the web request to be signed.
						'creq', // <file-name>.creq—the resulting canonical request.
						'sts', // <file-name>.sts—the resulting string to sign.
						'authz', // <file-name>.authz—the Authorization header.
						'sreq' // <file-name>.sreq— the signed request.
						].map(function (ext) {
							return fs.readFileAsync(path.join(suiteDir, group + '.' + ext), 'utf8');
						});

						Promise.settle(files).then(function (results) {
							var _results$map = results.map(function (r) {
								return r.value();
							});

							var _results$map2 = _slicedToArray(_results$map, 5);

							request = _results$map2[0];
							canonicalRequest = _results$map2[1];
							stringToSign = _results$map2[2];
							authorizationHeader = _results$map2[3];
							signedRequest = _results$map2[4];

							canonicalRequest = canonicalRequest.replace(/\r/g, '');
							stringToSign = stringToSign.replace(/\r/g, '');

							done();
						});
					});

					describe('Task 1: Create a Canonical Request for Signature Version 4', function () {
						it('should match the canonical request', function () {
							assert.strictEqual(sigv4.requestToCanonicalRequest(request), canonicalRequest);
						});
					});

					describe('Task 2: Create a String to Sign for Signature Version 4', function () {
						it('should match the string to sign', function () {
							assert.strictEqual(sigv4.stringToSign(algorithm, requestDate, credentialScope, sigv4.hash(canonicalRequest)), stringToSign);
						});
					});

					describe('Task 3: Calculate the AWS Signature Version 4', function () {
						it('should match the authorization header value', function () {
							var signedHeaders = canonicalRequest.split('\n').slice(-2, -1)[0];
							var signature = sigv4.sign(secretAccessKey, requestDate.slice(0, 8), 'us-east-1', 'host', stringToSign);

							assert.strictEqual(sigv4.authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature), authorizationHeader);
						});
					});

					describe('The Signed Request', function () {
						it('should match the signed request value', function () {
							assert.strictEqual(sigv4.addAuthorization(request, authorizationHeader), signedRequest);
						});
					});
				});
			});
		});
	})();
}

//# sourceMappingURL=test.js.map

//# sourceMappingURL=test.js.map

//# sourceMappingURL=test.js.map