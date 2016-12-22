import {normalize} from 'path';
import {createHmac, createHash} from 'crypto';
const algorithm = 'sha256';

export {normalize} from 'path';

/**
 * Computes the HMAC
 *
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} [encoding=binary] - The encoding type (hex|binary)
 * @returns {Promise<string|buffer>} - The output HMAC
 */
export function hmac(key, data, encoding='binary') {
	return Promise.resolve(
		createHmac(algorithm, key)
			.update(data)
			.digest(encoding)
	);
}

/**
 * Computes the hash
 *
 * @param {!string} data - The data to hash
 * @returns {Promise<string>} - The hashed output
 */
export function hash(data) {
	return Promise.resolve(
		createHash(algorithm)
			.update(data)
			.digest('hex')
	);
}