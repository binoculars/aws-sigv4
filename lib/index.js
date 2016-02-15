'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.hash = hash;
exports.formatDateTime = formatDateTime;
exports.canonicalRequest = canonicalRequest;
exports.stringToSign = stringToSign;
exports.sign = sign;
exports.authorization = authorization;
exports.querystringify = querystringify;
exports.parseRequest = parseRequest;
exports.parseHead = parseHead;
exports.addAuthorization = addAuthorization;
exports.requestToCanonicalRequest = requestToCanonicalRequest;

var _crypto = require('crypto');

var _path = require('path');

var _querystring = require('querystring');

var CRLF = '\n';

/**
 * Computes the HMAC
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} [encoding=binary] - The encoding type (hex|binary)
 * @returns {string|buffer} - The output HMAC
 */
function hmac(key, data) {
	var encoding = arguments.length <= 2 || arguments[2] === undefined ? 'binary' : arguments[2];

	return (0, _crypto.createHmac)('sha256', key).update(data).digest(encoding);
}

/**
 * Computes the hash
 * @param {!string} data - The data to hash
 * @returns {string} - The hashed output
 */
function hash(data) {
	return (0, _crypto.createHash)('sha256').update(data).digest('hex');
}

/**
 * Formats a Date object to an AWS date string
 * @param {!Date} date - The date
 * @returns {string} - The formatted date string
 */
function formatDateTime(date) {
	return date.toISOString().replace(/-|:|(\.\d+)/g, '');
}

/**
 * Creates the canonical request
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
 * @param {!string} httpRequestMethod - The HTTP request method (e.g. `GET` or `POST`)
 * @param {!string} canonicalURI - The canonical URI
 * @param {!string} canonicalQueryString - The canonical query string
 * @param {!string} canonicalHeaders - The canonical headers
 * @param {!string} signedHeaders - The signed headers
 * @param {!string} requestPayload - The payload of the request
 * @returns {string} - The canonical request
 */
function canonicalRequest(httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders, signedHeaders, requestPayload) {
	return [httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders, '', signedHeaders, hash(requestPayload || '')].join('\n');
}

/**
 * Creates the string to sign
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
 * @param {!string} algorithm - The algorithm (`AWS4-HMAC-SHA256`)
 * @param {!string} requestDate - The request date (`YYYMMDDThhmmssZ`)
 * @param {!string} credentialScope - the credential scope (formatted as `YYYYMMDD/region/service/aws4_request`)
 * @param {!string} hashedCanonicalRequest
 * @returns {string} - The string to sign
 */
function stringToSign(algorithm, requestDate, credentialScope, hashedCanonicalRequest) {
	return [algorithm, requestDate, credentialScope, hashedCanonicalRequest].join('\n');
}

/**
 * Calculates the signature
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
 * @param {!string} secretAccessKey - The secret access key for the AWS account
 * @param {!string} date - The date in YYYYMMDD format
 * @param {!string} region - The AWS region (e.g. `us-east-1`)
 * @param {!string} service - The AWS service (e.g. `iam`)
 * @param {!string} stringToSign - The string to sign
 * @returns {string} - The signature
 */
function sign(secretAccessKey, date, region, service, stringToSign) {
	var signingKey = 'AWS4' + secretAccessKey;

	[date, region, service, 'aws4_request'].forEach(function (data) {
		return signingKey = hmac(signingKey, data);
	});

	return hmac(signingKey, stringToSign, 'hex');
}

/**
 * Creates the authorization string
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
 * @param algorithm
 * @param accessKeyId
 * @param credentialScope
 * @param signedHeaders
 * @param signature
 * @returns {string}
 */
function authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature) {
	var auth = {
		'Credential': accessKeyId + '/' + credentialScope,
		'SignedHeaders': signedHeaders,
		'Signature': signature
	};

	return [algorithm, Object.keys(auth).map(function (key) {
		return [key, auth[key]].join('=');
	}).join(', ')].join(' ');
}

/**
 *
 * @param action
 * @param algorithm
 * @param accessKeyId
 * @param credentialScope
 * @param date
 * @param timeoutInterval
 * @param signedHeaders
 * @param signature
 * @returns {string}
 */
function querystringify(action, algorithm, accessKeyId, credentialScope, date, timeoutInterval, signedHeaders, signature) {
	return action + (0, _querystring.stringify)({
		'X-Amz-Algorithm': algorithm,
		'X-Amz-Credential': accessKeyId + '/' + credentialScope,
		'X-Amz-Date': date,
		'X-Amz-Expires': timeoutInterval,
		'X-Amz-SignedHeaders': signedHeaders,
		'X-Amz-Signature': signature
	});
}

/**
 *
 * @param request
 * @returns {{head: string, body: string}}
 */
function parseRequest(request) {
	var _request$split = request.split(CRLF.repeat(2));

	var _request$split2 = _slicedToArray(_request$split, 2);

	var head = _request$split2[0];
	var body = _request$split2[1];


	return { head: head, body: body };
}

/**
 *
 * @param head
 * @param body
 * @returns {string}
 */
function unparseRequest(head, body) {
	return [head, body].join(CRLF.repeat(2)).trim();
}

/**
 *
 * @param head
 * @returns {{method: string, requestURI: string, httpVersion: string, headers: Array.<string>}}
 */
function parseHead(head) {
	var lines = head.split(CRLF);
	var requestLine = lines[0];
	var headers = lines.slice(1);

	var _parseRequestLine = parseRequestLine(requestLine);

	var method = _parseRequestLine.method;
	var requestURI = _parseRequestLine.requestURI;
	var httpVersion = _parseRequestLine.httpVersion;


	return { method: method, requestURI: requestURI, httpVersion: httpVersion, headers: headers };
}

/**
 *
 * @param requestLine
 * @returns {{method: string, requestURI: string, httpVersion: string}}
 */
function parseRequestLine(requestLine) {
	var method = requestLine.match(/^\s*[A-Z]+\s/ig)[0];
	var httpVersion = requestLine.match(/\s+http\/\d+\.\d+$/ig)[0];
	var requestURI = requestLine.slice(method.length, -httpVersion.length);

	return {
		method: method.trim(),
		requestURI: requestURI,
		httpVersion: httpVersion.trim()
	};
}

/**
 *
 * @param rawUrl
 * @returns {{canonicalURI: string, canonicalQueryString: string}}
 */
function parseUrl(rawUrl) {
	var _rawUrl$split = rawUrl.split(/\?(.+)/);

	var _rawUrl$split2 = _slicedToArray(_rawUrl$split, 2);

	var uri = _rawUrl$split2[0];
	var query = _rawUrl$split2[1];

	var queryParams = {};
	var canonicalQueryString = '';

	if (query) {
		var splitQuery = query.replace(/\s(.+)/, '').split('&');
		var correctedQuery = [];

		console.log(splitQuery);

		if (splitQuery.length > 1) {
			for (var i = 0; i < splitQuery.length; i++) {
				correctedQuery.push(splitQuery[i] + (~splitQuery[i].indexOf('=') ? '' : '&' + splitQuery[++i]));
			}
		} else {
			correctedQuery = splitQuery;
		}

		correctedQuery.forEach(function (param) {
			var _param$split = param.split('=');

			var _param$split2 = _slicedToArray(_param$split, 2);

			var name = _param$split2[0];
			var val = _param$split2[1];


			if (name in queryParams) {
				queryParams[name].push(val);
			} else {
				queryParams[name] = [val];
			}
		});

		var queryParamsList = Object.keys(queryParams).sort();

		canonicalQueryString = queryParamsList.map(function (key) {
			return queryParams[key].sort().map(function (val) {
				return [encodeURIComponent(key), encodeURIComponent(val || '')].join('=');
			}).join('&');
		}).join('&');
	}

	return {
		canonicalURI: (0, _path.normalize)(uri),
		canonicalQueryString: canonicalQueryString
	};
}

/**
 *
 * @param rawHeaders
 * @returns {{canonicalHeadersString: string, signedHeadersString: string}}
 */
function parseCanonicalHeaders(rawHeaders) {
	var headersMap = {};
	var lastHeaderName = undefined;

	rawHeaders.forEach(function (header) {
		var _header$split$slice = header.split(/:(.+)/).slice(0, 2);

		var _header$split$slice2 = _slicedToArray(_header$split$slice, 2);

		var name = _header$split$slice2[0];
		var value = _header$split$slice2[1];


		if (value) {
			name = name.toLowerCase();
			lastHeaderName = name;
		} else {
			name = lastHeaderName;
			value = header;
		}

		value = value.replace(/\s+/g, ' ').trim();

		if (name in headersMap) {
			headersMap[name].push(value);
		} else {
			headersMap[name] = [value];
		}
	});

	var signedHeadersList = Object.keys(headersMap).sort();

	var canonicalHeadersString = signedHeadersList.map(function (key) {
		return [key, headersMap[key].join(',')].join(':');
	}).join('\n');

	var signedHeadersString = signedHeadersList.join(';');

	return { canonicalHeadersString: canonicalHeadersString, signedHeadersString: signedHeadersString };
}

/**
 *
 * @param request
 * @param authorization
 * @returns {string}
 */
function addAuthorization(request, authorization) {
	var parsedRequest = parseRequest(request);

	return unparseRequest(parsedRequest.head + CRLF + 'Authorization: ' + authorization, parsedRequest.body);
}

/**
 *
 * @param request
 * @returns {string}
 */
function requestToCanonicalRequest(request) {
	var parsedRequest = parseRequest(request);
	var parsedHead = parseHead(parsedRequest.head);
	var parsedUrl = parseUrl(parsedHead.requestURI);
	var parsedHeaders = parseCanonicalHeaders(parsedHead.headers);

	return canonicalRequest(parsedHead.method, parsedUrl.canonicalURI, parsedUrl.canonicalQueryString, parsedHeaders.canonicalHeadersString, parsedHeaders.signedHeadersString, parsedRequest.body);
}
//# sourceMappingURL=index.js.map