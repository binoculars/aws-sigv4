'use strict';

import 'babel/register';
import * as crypto from 'crypto';
import * as path from 'path';
import * as querystring from 'querystring';

const CRLF = '\r\n';

/**
 * Computes the HMAC
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} [encoding=binary] - The encoding type (hex|binary)
 * @returns {string|buffer} - The output HMAC
 */
function hmac(key, data, encoding='binary') {
	return crypto
		.createHmac('sha256', key)
		.update(data)
		.digest(encoding);
}

/**
 * Computes the hash
 * @param {!string} data - The data to hash
 * @returns {string} - The hashed output
 */
export function hash(data) {
	return crypto
		.createHash('sha256')
		.update(data)
		.digest('hex');
}

/**
 * Formats a Date object to an AWS date string
 * @param {!Date} date - The date
 * @returns {string} - The formatted date string
 */
export function formatDateTime(date) {
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
export function canonicalRequest(httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders, signedHeaders,
                                 requestPayload) {
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
 * @param algorithm
 * @param accessKeyId
 * @param credentialScope
 * @param signedHeaders
 * @param signature
 * @returns {string}
 */
export function authorization(algorithm, accessKeyId, credentialScope, signedHeaders, signature) {
	let auth = {
		'Credential': accessKeyId + '/' + credentialScope,
		'SignedHeaders': signedHeaders,
		'Signature': signature
	};

	return [
		algorithm,
		Object
			.keys(auth)
			.map(key => [key, auth[key]].join('='))
			.join(', ')
	].join(' ');
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
 * @returns {*}
 */
export function querystringify(action, algorithm, accessKeyId, credentialScope, date, timeoutInterval, signedHeaders,
                               signature) {
	return action + querystring.stringify({
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
 * @returns {{head: *, body: *}}
 */
export function parseRequest(request) {
	let [head, body] = request.split(CRLF + CRLF);

	return {head, body};
}

/**
 *
 * @param head
 * @param body
 * @returns {string}
 */
function unparseRequest(head, body) {
	return [
		head,
		body
	].join(CRLF.repeat(2));
}

/**
 *
 * @param head
 * @returns {{method: string, requestURI: string, httpVersion: string, headers: Array.<string>}}
 */
export function parseHead(head) {
	let lines = head.split(CRLF);
	let requestLine = lines[0];
	let headers = lines.slice(1);
	let {method, requestURI, httpVersion} = parseRequestLine(requestLine);

	return {method, requestURI, httpVersion, headers};
}

/**
 *
 * @param requestLine
 * @returns {{method: string, requestURI: string, httpVersion: string}}
 */
function parseRequestLine(requestLine) {
	let method = requestLine
		.match(/^[A-Z]+\s/ig)[0];
	let httpVersion = requestLine
		.match(/\shttp\/\d+\.\d+$/ig)[0];
	let requestURI = requestLine
		.slice(method.length, -httpVersion.length);

	return {
		method: method.trim(),
		requestURI: requestURI,
		httpVersion: httpVersion.trim()
	};
}

/**
 *
 * @param rawUrl
 * @returns {{canonicalURI: (XMLList|XML), canonicalQueryString: string}}
 */
function parseUrl(rawUrl) {
	let [uri, query] = rawUrl.split(/\?(.+)/);
	let queryParams = {};
	let canonicalQueryString = '';

	if (query) {
		query.replace(/\s(.+)/g, '')
			.replace(/\+/g, ' ')
			.split('&')
			.forEach(param => {
				let [name, val] = param.split('=');

				if (name in queryParams) {
					queryParams[name].push(val);
				} else {
					queryParams[name] = [val];
				}
			})
		;

		let queryParamsList = Object.keys(queryParams).sort();

		canonicalQueryString = queryParamsList.map(key => {
			return queryParams[key]
				.sort()
				.map(val => {
					return [
						encodeURIComponent(key),
						encodeURIComponent(val || '')
					].join('=');
				})
				.join('&');
		}).join('&');
	}

	return {
		canonicalURI: path.normalize(uri),
		canonicalQueryString
	};
}

/**
 *
 * @param rawHeaders
 * @returns {{canonicalHeadersString: string, signedHeadersString: string}}
 */
function parseCanonicalHeaders(rawHeaders) {
	let headersMap = {};

	rawHeaders.forEach(header => {
		let [name, value] = header.split(/:(.+)/).slice(0, 2);

		name = name.toLowerCase();
		value = value.trim();

		if (name in headersMap) {
			headersMap[name].push(value);
		} else {
			headersMap[name] = [value];
		}
	});

	let signedHeadersList = Object.keys(headersMap).sort();

	let canonicalHeadersString = signedHeadersList.map(key => {
		return [
			key,
			headersMap[key].sort().join(',')
		].join(':');
	}).join('\n');

	let signedHeadersString = signedHeadersList.join(';');

	return {canonicalHeadersString, signedHeadersString};
}

/**
 *
 * @param request
 * @param authorization
 * @returns {string}
 */
export function addAuthorization(request, authorization) {
	let parsedRequest = parseRequest(request);

	return unparseRequest(
		parsedRequest.head + CRLF + 'Authorization: ' + authorization,
		parsedRequest.body
	);
}

/**
 *
 * @param request
 * @returns {string}
 */
export function requestToCanonicalRequest(request) {
	let parsedRequest = parseRequest(request);
	let parsedHead = parseHead(parsedRequest.head);
	let parsedUrl = parseUrl(parsedHead.requestURI);
	let parsedHeaders = parseCanonicalHeaders(parsedHead.headers);

	return canonicalRequest(
		parsedHead.method,
		parsedUrl.canonicalURI,
		parsedUrl.canonicalQueryString,
		parsedHeaders.canonicalHeadersString,
		parsedHeaders.signedHeadersString,
		parsedRequest.body
	);
}