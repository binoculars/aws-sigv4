const crypto = window.crypto || window.msCrypto;
const subtle = crypto.subtle || crypto.webkitSubtle;
const algorithm = 'sha-256';

export const normalize = encodeURI;

function toHex(buffer) {
	const bytes = new Uint8Array(buffer);

	let str = '';

	for (let i = 0; i < bytes.length; ++i) {
		const byte = bytes[i].toString(16);
		str += `${byte.length < 2 ? '0' : ''}${byte}`;
	}

	return str;
}

const toBinary = ('TextEncoder' in window) ?
	(str => (new TextEncoder()).encode(str)) :
	(str => {
		const len = str.length;
		const buf = new ArrayBuffer(len * 2);
		const bufView = new Uint16Array(buf);

		for (let i = 0; i < len; i++)
			bufView[i] = str.charCodeAt(i);

		return buf;
	});

const hashOptions = {
	name: algorithm
};

const algorithmSign = {
	name: 'HMAC',
	hash: hashOptions
};

/**
 * Computes the HMAC
 *
 * @param {!string|ArrayBuffer} key - The key
 * @param {!string} data - The data to hash
 * @param {?string} encoding - The encoding type (hex)
 * @returns {string|ArrayBuffer} - The output HMAC
 */
export async function hmac(key, data, encoding) {
	const importedKey = await subtle.importKey(
		'raw',
		typeof key === 'string' ? toBinary(key) : key,
		algorithmSign,
		false,
		['sign']
	);

	const buffer = await subtle.sign(
		algorithmSign,
		importedKey,
		toBinary(data)
	);

	return encoding === 'hex' ? toHex(buffer) : buffer;
}

/**
 * Computes the hash
 *
 * @param {!string} data - The data to hash
 * @returns {string} - The hashed output
 */
export async function hash(data) {
	return toHex(
		await subtle.digest(
			hashOptions,
			toBinary(data)
		)
	);
}