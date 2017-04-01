(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["sigv4"] = factory();
	else
		root["sigv4"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports,'__esModule',{value:!0}),exports.hash=void 0,exports.formatDateTime=formatDateTime,exports.buildCanonicalRequest=buildCanonicalRequest,exports.buildStringToSign=buildStringToSign,exports.preCalculateSigningKey=preCalculateSigningKey,exports.preCalculatedSign=preCalculatedSign,exports.sign=sign,exports.buildAuthorization=buildAuthorization;var _deps=__webpack_require__(1);exports.hash=_deps.hash;var algorithm='AWS4-HMAC-SHA256',emptyHash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';function formatDateTime(a){return a.toISOString().replace(/-|:|(\.\d+)/g,'')}function buildCanonicalRequest(a,b,c,d,e){var f=5<arguments.length&&arguments[5]!==void 0?arguments[5]:'';return(f?(0,_deps.hash)(f):Promise.resolve(emptyHash)).then(function(g){return[a,b,c,d,'',e,g].join('\n')})}function buildStringToSign(a,b,c){return[algorithm,a,b,c].join('\n')}function preCalculateSigningKey(a,b,c,d){var e=[b,c,d,'aws4_request'],f=Promise.resolve(`AWS4${a}`),g=function _loop(m){f=f.then(function(n){return(0,_deps.hmac)(n,m)})},h=!0,i=!1,j=void 0;try{for(var l,m,k=e[Symbol.iterator]();!(h=(l=k.next()).done);h=!0)m=l.value,g(m)}catch(m){i=!0,j=m}finally{try{!h&&k.return&&k.return()}finally{if(i)throw j}}return f}function preCalculatedSign(a,b){return(0,_deps.hmac)(a,b,'hex')}function sign(a,b,c,d,e){return preCalculateSigningKey(a,b,c,d).then(function(f){return preCalculatedSign(f,e)})}function buildAuthorization(a,b,c,d){return algorithm+' '+[['Credential',`${a}/${b}`],['SignedHeaders',c],['Signature',d]].map(function(e){return e.join('=')}).join(', ')}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports,'__esModule',{value:!0}),exports.hmac=hmac,exports.hash=hash;var crypto=window.crypto||window.msCrypto,subtle=crypto.subtle||crypto.webkitSubtle,algorithm='sha-256',normalize=exports.normalize=encodeURI;function toHex(a){for(var e,b=new Uint8Array(a),c='',d=0;d<b.length;++d)e=b[d].toString(16),c+=`${2>e.length?'0':''}${e}`;return c}var toBinary='TextEncoder'in window?function(a){return new TextEncoder().encode(a)}:function(a){for(var b=a.length,c=new ArrayBuffer(2*b),d=new Uint16Array(c),e=0;e<b;e++)d[e]=a.charCodeAt(e);return c},hashOptions={name:algorithm},algorithmSign={name:'HMAC',hash:hashOptions};function hmac(a,b){var c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:'binary';return subtle.importKey('raw','string'==typeof a?toBinary(a):a,algorithmSign,!1,['sign']).then(function(d){return subtle.sign(algorithmSign,d,toBinary(b))}).then(function(d){return'binary'===c?d:toHex(d)})}function hash(a){return subtle.digest(hashOptions,toBinary(a)).then(toHex)}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ })
/******/ ]);
});
//# sourceMappingURL=index.js.map