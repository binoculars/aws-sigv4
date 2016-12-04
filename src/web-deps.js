const crypto = window.crypto || window.msCrypto;
const subtle = crypto.subtle || crypto.webkitSubtle;
const algorithm = 'SHA-256';

export const normalize = encodeURI;

function toHex(buffer) {
	return new DataView(buffer)
		.getInt8(1)
		.toString(16);
}

const toString = ('TextEncoder' in window) ?
	(str => (new TextEncoder()).encode(str)) :
	(str => {
		const len = str.length;
		const buf = new ArrayBuffer(len * 2);
		const bufView = new Uint16Array(buf);
		for (let i = 0; i < len; i++)
			bufView[i] = str.charCodeAt(i);
		return buf;
	});

const algorithmSign = {
	name: 'HMAC',
	hash: {
		name: algorithm
	}
};

/**
 * Computes the HMAC
 *
 * @param {!string} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} [encoding=binary] - The encoding type (hex|binary)
 * @returns {string|buffer} - The output HMAC
 */
export function hmac(key, data, encoding='binary') {
	return subtle
		.importKey(
			'raw',
			key,
			{
				name: 'HMAC'
			},
			false,
			['sign']
		)
		.then(importedKey => subtle
			.sign(
				algorithmSign,
				importedKey,
				data
			)
		)
		.then(buffer =>
			encoding === 'binary' ? buffer : toHex(buffer)
		);
}

/**
 * Computes the hash
 *
 * @param {!string} data - The data to hash
 * @returns {string} - The hashed output
 */
export function hash(data) {
	return subtle
		.digest(
			{
				name: algorithm
			},
			data
		)
		.then(toHex);
}