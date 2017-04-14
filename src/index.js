import {hash, hmac, normalize} from 'deps';

export {hash};

const algorithm = 'AWS4-HMAC-SHA256';
const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * Formats a Date object to an AWS date string
 *
 * @param {!Date} date - The date
 * @returns {string} - The formatted date string
 */
export function formatDateTime(date) {
	return date
		.toISOString()
		.replace(/-|:|(\.\d+)/g, '');
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
 * @returns {Promise<string>} - The canonical request
 */
export async function buildCanonicalRequest(httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders,
                                            signedHeaders, requestPayload='') {
	return [
		httpRequestMethod,
		canonicalURI,
		canonicalQueryString,
		canonicalHeaders,
		'',
		signedHeaders,
		await (requestPayload ? hash(requestPayload) : emptyHash)
	].join('\n');
}

/**
 * Creates the string to sign
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
 *
 * @param {!string} requestDate - The request date (`YYYMMDDThhmmssZ`)
 * @param {!string} credentialScope - the credential scope (formatted as `YYYYMMDD/region/service/aws4_request`)
 * @param {!string} hashedCanonicalRequest
 * @returns {string} - The string to sign
 */
export function buildStringToSign(requestDate, credentialScope, hashedCanonicalRequest) {
	return [
		algorithm,
		requestDate,
		credentialScope,
		hashedCanonicalRequest
	].join('\n');
}

/**
 * Pre-calculates the signing key
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
 *
 * @param {!string} secretAccessKey - The secret access key for the AWS account
 * @param {!string} date - The date in YYYYMMDD format
 * @param {!string} region - The AWS region (e.g. `us-east-1`)
 * @param {!string} service - The AWS service (e.g. `iam`)
 * @returns {Promise<string>} - The pre-calculated signing key
 */
export async function preCalculateSigningKey(secretAccessKey, date, region, service) {
	return [
		date,
		region,
		service,
		'aws4_request'
	].reduce(
		async (acc, val) => hmac(await acc, val),
		`AWS4${secretAccessKey}`
	);
}

/**
 * Pre-calculates the signature
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
 *
 * @param {!string} signingKey - The pre-calculated signing key
 * @param {!string} stringToSign - The string to sign
 * @returns {Promise<string>} - The pre-calculated signature
 */
export function preCalculatedSign(signingKey, stringToSign) {
	return hmac(signingKey, stringToSign, 'hex');
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
 * @returns {Promise<string>} - The signature
 */
export async function sign(secretAccessKey, date, region, service, stringToSign) {
	const signingKey = await preCalculateSigningKey(secretAccessKey, date, region, service);

	return preCalculatedSign(signingKey, stringToSign);
}

/**
 * Creates the authorization string
 * https://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html
 *
 * @param {!string} accessKeyId
 * @param {!string} credentialScope
 * @param {!string} signedHeaders
 * @param {!string} signature
 * @returns {string}
 */
export function buildAuthorization(accessKeyId, credentialScope, signedHeaders, signature) {
	return algorithm + ' ' + [
		['Credential', `${accessKeyId}/${credentialScope}`],
		['SignedHeaders', signedHeaders],
		['Signature', signature]
	]
		.map(item => item.join('='))
		.join(', ');
}
