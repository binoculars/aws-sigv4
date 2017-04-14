import {normalize} from 'path';
import {createHmac, createHash} from 'crypto';
const algorithm = 'sha256';

export {normalize} from 'path';

/**
 * Computes the HMAC
 *
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} encoding - The encoding type (hex)
 * @returns {Promise<string|buffer>} - The output HMAC
 */
export async function hmac(key, data, encoding) {
	return createHmac(algorithm, key)
		.update(data)
		.digest(encoding);
}

/**
 * Computes the hash
 *
 * @param {!string} data - The data to hash
 * @returns {Promise<string>} - The hashed output
 */
export async function hash(data) {
	return createHash(algorithm)
		.update(data)
		.digest('hex');
}