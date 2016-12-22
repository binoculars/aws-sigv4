import sigv4 from '../lib/node/index';
import {normalize} from 'path';
import {stringify} from 'querystring';

const NL = '\n';

/**
 * Parses an HTTP request into a header and body
 *
 * @param {!string} request
 * @returns {{head: string, body: string}}
 */
export function parseRequest(request) {
	const [head, body] = request.split(NL.repeat(2));

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
	return `${head}${NL.repeat(2)}${body}`
		.trim();
}

/**
 * Parses an HTTP header into its component parts
 *
 * @param {!string} head
 * @returns {{method: string, requestURI: string, httpVersion: string, headers: Array.<string>}}
 */
export function parseHead(head) {
	const lines = head.split(NL);
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
		requestURI,
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
				correctedQuery.push(splitQuery[i] + (splitQuery[i].includes('=') ? '' : '&' + splitQuery[++i]));
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

	const canonicalURI = encodeURIComponent(normalize(uri))
		.replace(/%2F/g, '/');

	return {
		canonicalURI,
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

	for (let header of rawHeaders) {
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
	}

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
	const tokenLine = securityToken ? `${NL}X-Amz-Security-Token:${securityToken}` : '';
	const authorizationLine =`${NL}Authorization: ${authorization}`;

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

	return sigv4.buildCanonicalRequest(
		parsedHead.method,
		parsedUrl.canonicalURI,
		parsedUrl.canonicalQueryString,
		parsedHeaders.canonicalHeadersString,
		parsedHeaders.signedHeadersString,
		parsedRequest.body
	);
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