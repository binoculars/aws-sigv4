'use strict';

import {createHmac, createHash} from 'crypto';
import {normalize} from 'path';
import {stringify} from 'querystring';

const CRLF = '\n';

/**
 * Computes the HMAC
 *
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} [encoding=binary] - The encoding type (hex|binary)
 * @returns {string|buffer} - The output HMAC
 */
function hmac(key, data, encoding='binary') {
	return createHmac('sha256', key)
		.update(data)
		.digest(encoding);
}

/**
 * Computes the hash
 *
 * @param {!string} data - The data to hash
 * @returns {string} - The hashed output
 */
export function hash(data) {
	return createHash('sha256')
		.update(data)
		.digest('hex');
}

/**
 * Formats a Date object to an AWS date string
 *
 * @param {!Date} date - The date
 * @returns {string} - The formatted date string
 */
export function formatDateTime(date) {
	return date.toISOString().replace(/-|:|(\.\d+)/g, '');
}

/**
 * Creates the canonical request
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
 *
 * @param {!string} httpRequestMethod - The HTTP request method (e.g. `GET` or `POST`)
 * @param {!string} canonicalURI - The canonical URI
 * @param {!string} canonicalQueryString - The canonical query string
 * @param {!string} canonicalHeaders - The canonical headers
 * @param {!string} signedHeaders - The signed headers
 * @param {!string} requestPayload - The payload of the request
 * @returns {string} - The canonical request
 */
export function canonicalRequest(httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders, signedHeaders,
                                 requestPayload='') {
	return [
		httpRequestMethod,
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		'',
		signedHeaders,
		hash(requestPayload)
	].join('\n');
}

/**
 * Creates the string to sign
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
 *
 * @param {!string} algorithm - The algorithm (`AWS4-HMAC-SHA256`)
 * @param {!string} requestDate - The request date (`YYYMMDDThhmmssZ`)
 * @param {!string} credentialScope - the credential scope (formatted as `YYYYMMDD/region/service/aws4_request`)
 * @param {!string} hashedCanonicalRequest
 * @returns {string} - The string to sign
 */
export function stringToSign(algorithm, requestDate, credentialScope, hashedCanonicalRequest) {
	return [
		algorithm,
		requestDate,
		credentialScope,
		hashedCanonicalRequest
	].join('\n');
}

/**
 * Calculates the signature
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
 *
 * @param {!string} secretAccessKey - The secret access key for the AWS account
 * @param {!string} date - The date in YYYYMMDD format
 * @param {!string} region - The AWS region (e.g. `us-east-1`)
 * @param {!string} service - The AWS service (e.g. `iam`)
 * @param {!string} stringToSign - The string to sign
 * @returns {string} - The signature
 */
export function sign(secretAccessKey, date, region, service, stringToSign) {
	let signingKey = 'AWS4' + secretAccessKey;

	[
		date,
		region,
		service,
		'aws4_request'
	].forEach(data => signingKey = hmac(signingKey, data));

	return hmac(signingKey, stringToSign, 'hex');
}

/**
 * Creates the authorization string
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
 *
 * @param {!string} algorithm
 * @param {!string} accessKeyId
 * @param {!string} credentialScope
 * @param {!string} signedHeaders
 * @param {!string} signature
 * @returns {string}
 */
export function authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature) {
	const auth = {
		'Credential': accessKeyId + '/' + credentialScope,
		'SignedHeaders': signedHeaders,
		'Signature': signature
	};

	return [
		algorithm,
		Object
			.keys(auth)
			.map(key => `${key}=${auth[key]}`)
			.join(', ')
	].join(' ');
}

/**
 * Creates a query string
 *
 * @param {!string} action
 * @param {!string} algorithm
 * @param {!string} accessKeyId
 * @param {!string} credentialScope
 * @param {!string} date
 * @param {!string} timeoutInterval
 * @param {!string} signedHeaders
 * @param {!string} signature
 * @returns {string}
 */
export function querystringify(action, algorithm, accessKeyId, credentialScope, date, timeoutInterval, signedHeaders,
                               signature) {
	return action + stringify({
		'X-Amz-Algorithm': algorithm,
		'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
		'X-Amz-Date': date,
		'X-Amz-Expires': timeoutInterval,
		'X-Amz-SignedHeaders': signedHeaders,
		'X-Amz-Signature': signature
	});
}

/**
 * Parses an HTTP request into a header and body
 *
 * @param {!string} request
 * @returns {{head: string, body: string}}
 */
export function parseRequest(request) {
	const [head, body] = request.split(CRLF.repeat(2));

	return {head, body};
}

/**
 * Unparses an HTTP header and an HTTP body into an HTTP request
 *
 * @param {!string} head
 * @param {string} body
 * @returns {string}
 */
function unparseRequest(head, body='') {
	return `${head}${CRLF.repeat(2)}${body}`
		.trim();
}

/**
 * Parses an HTTP header into its component parts
 *
 * @param {!string} head
 * @returns {{method: string, requestURI: string, httpVersion: string, headers: Array.<string>}}
 */
export function parseHead(head) {
	const lines = head.split(CRLF);
	const requestLine = lines[0];
	const headers = lines.slice(1);
	const {method, requestURI, httpVersion} = parseRequestLine(requestLine);

	return {method, requestURI, httpVersion, headers};
}

/**
 * Parses an HTTP request line into its component parts
 *
 * @param {!string} requestLine
 * @returns {{method: string, requestURI: string, httpVersion: string}}
 */
function parseRequestLine(requestLine) {
	const method = requestLine
		.match(/^\s*[A-Z]+\s/ig)[0];
	const httpVersion = requestLine
		.match(/\s+http\/\d+\.\d+$/ig)[0];
	const requestURI = requestLine
		.slice(method.length, -httpVersion.length);

	return {
		method: method.trim(),
		requestURI: requestURI,
		httpVersion: httpVersion.trim()
	};
}

/**
 * Parses a URL into its canonical parts
 *
 * @param {!string} rawUrl
 * @returns {{canonicalURI: string, canonicalQueryString: string}}
 */
function parseUrl(rawUrl) {
	const [uri, query] = rawUrl.split(/\?(.+)/);
	const queryParams = {};
	let canonicalQueryString = '';

	if (query) {
		const splitQuery = query
			.replace(/\s(.+)/, '')
			.split('&');
		let correctedQuery = [];

		if (splitQuery.length > 1) {
			for (let i = 0; i < splitQuery.length; i++) {
				correctedQuery.push(splitQuery[i] + (~splitQuery[i].indexOf('=') ? '' : '&' + splitQuery[++i]));
			}
		} else {
			correctedQuery = splitQuery;
		}

		correctedQuery.forEach(param => {
			const [name, val] = param.split('=');

			if (name in queryParams) {
				queryParams[name].push(val);
			} else {
				queryParams[name] = [val];
			}
		});

		let queryParamsList = Object
			.keys(queryParams)
			.sort();

		canonicalQueryString = queryParamsList
			.map(key => queryParams[key]
				.sort()
				.map(val => `${encodeURIComponent(key)}=${encodeURIComponent(val || '')}`)
				.join('&')
			)
			.join('&');
	}

	return {
		canonicalURI: normalize(uri),
		canonicalQueryString
	};
}

/**
 * Parses raw headers into canonical headers and signed headers
 *
 * @param {Array<string>} rawHeaders
 * @returns {{canonicalHeadersString: string, signedHeadersString: string}}
 */
function parseCanonicalHeaders(rawHeaders) {
	const headersMap = {};
	let lastHeaderName;

	rawHeaders.forEach(header => {
		let [name, value] = header
			.split(/:(.+)/)
			.slice(0, 2);

		if (value) {
			name = name.toLowerCase();
			lastHeaderName = name;
		} else {
			name = lastHeaderName;
			value = header;
		}

		value = value
			.replace(/\s+/g, ' ')
			.trim();

		if (name in headersMap) {
			headersMap[name].push(value);
		} else {
			headersMap[name] = [value];
		}
	});

	const signedHeadersList = Object
		.keys(headersMap)
		.sort();

	const canonicalHeadersString = signedHeadersList
		.map(key => `${key}:${headersMap[key].join(',')}`)
		.join('\n');

	const signedHeadersString = signedHeadersList.join(';');

	return {canonicalHeadersString, signedHeadersString};
}

/**
 * Adds the authorization headers, and optionally, the STS security token to the request
 *
 * @param {!string} request
 * @param {!string} authorization
 * @param {!string} [securityToken]
 * @returns {string}
 */
export function addAuthorization(request, authorization, securityToken) {
	const parsedRequest = parseRequest(request);
	const tokenLine = securityToken ? `${CRLF}X-Amz-Security-Token:${securityToken}` : '';
	const authorizationLine =`${CRLF}Authorization: ${authorization}`;

	return unparseRequest(
		`${parsedRequest.head}${tokenLine}${authorizationLine}`,
		parsedRequest.body
	);
}

/**
 * Creates a canonical request from a standard request
 *
 * @param {!string} request
 * @returns {string}
 */
export function requestToCanonicalRequest(request) {
	const parsedRequest = parseRequest(request);
	const parsedHead = parseHead(parsedRequest.head);
	const parsedUrl = parseUrl(parsedHead.requestURI);
	const parsedHeaders = parseCanonicalHeaders(parsedHead.headers);

	return canonicalRequest(
		parsedHead.method,
		parsedUrl.canonicalURI,
		parsedUrl.canonicalQueryString,
		parsedHeaders.canonicalHeadersString,
		parsedHeaders.signedHeadersString,
		parsedRequest.body
	);
}