(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports,'__esModule',{value:true});exports.sign=exports.preCalculateSigningKey=exports.buildCanonicalRequest=exports.hash=undefined;let buildCanonicalRequest=exports.buildCanonicalRequest=(()=>{var _ref=_asyncToGenerator(function*(httpRequestMethod,canonicalURI,canonicalQueryString,canonicalHeaders,signedHeaders,requestPayload=''){return[httpRequestMethod,canonicalURI,canonicalQueryString,canonicalHeaders,'',signedHeaders,yield requestPayload?(0,_deps.hash)(requestPayload):emptyHash].join('\n')});return function buildCanonicalRequest(_x,_x2,_x3,_x4,_x5){return _ref.apply(this,arguments)}})();let preCalculateSigningKey=exports.preCalculateSigningKey=(()=>{var _ref2=_asyncToGenerator(function*(secretAccessKey,date,region,service){return[date,region,service,'aws4_request'].reduce((()=>{var _ref3=_asyncToGenerator(function*(acc,val){return(0,_deps.hmac)((yield acc),val)});return function(_x10,_x11){return _ref3.apply(this,arguments)}})(),`AWS4${secretAccessKey}`)});return function preCalculateSigningKey(_x6,_x7,_x8,_x9){return _ref2.apply(this,arguments)}})();let sign=exports.sign=(()=>{var _ref4=_asyncToGenerator(function*(secretAccessKey,date,region,service,stringToSign){const signingKey=yield preCalculateSigningKey(secretAccessKey,date,region,service);return preCalculatedSign(signingKey,stringToSign)});return function sign(_x12,_x13,_x14,_x15,_x16){return _ref4.apply(this,arguments)}})();exports.formatDateTime=formatDateTime;exports.buildStringToSign=buildStringToSign;exports.preCalculatedSign=preCalculatedSign;exports.buildAuthorization=buildAuthorization;var _deps=__webpack_require__(1);function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step('next',value)},function(err){step('throw',err)})}}return step('next')})}}exports.hash=_deps.hash;const algorithm='AWS4-HMAC-SHA256';const emptyHash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';function formatDateTime(date){return date.toISOString().replace(/-|:|(\.\d+)/g,'')}function buildStringToSign(requestDate,credentialScope,hashedCanonicalRequest){return[algorithm,requestDate,credentialScope,hashedCanonicalRequest].join('\n')}function preCalculatedSign(signingKey,stringToSign){return(0,_deps.hmac)(signingKey,stringToSign,'hex')}function buildAuthorization(accessKeyId,credentialScope,signedHeaders,signature){return algorithm+' '+[['Credential',`${accessKeyId}/${credentialScope}`],['SignedHeaders',signedHeaders],['Signature',signature]].map(item=>item.join('=')).join(', ')}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports,'__esModule',{value:true});exports.hash=exports.hmac=exports.normalize=undefined;let hmac=exports.hmac=(()=>{var _ref=_asyncToGenerator(function*(key,data,encoding){return(0,_crypto.createHmac)(algorithm,key).update(data).digest(encoding)});return function hmac(_x,_x2,_x3){return _ref.apply(this,arguments)}})();let hash=exports.hash=(()=>{var _ref2=_asyncToGenerator(function*(data){return(0,_crypto.createHash)(algorithm).update(data).digest('hex')});return function hash(_x4){return _ref2.apply(this,arguments)}})();var _path=__webpack_require__(3);Object.defineProperty(exports,'normalize',{enumerable:true,get:function get(){return _path.normalize}});var _crypto=__webpack_require__(2);function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step('next',value)},function(err){step('throw',err)})}}return step('next')})}}const algorithm='sha256';

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ })
/******/ ])));
//# sourceMappingURL=index.js.map