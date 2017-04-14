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
Object.defineProperty(exports,'__esModule',{value:true});exports.sign=exports.preCalculateSigningKey=exports.buildCanonicalRequest=exports.hash=undefined;var buildCanonicalRequest=exports.buildCanonicalRequest=function(){var _ref=_asyncToGenerator(regeneratorRuntime.mark(function _callee(httpRequestMethod,canonicalURI,canonicalQueryString,canonicalHeaders,signedHeaders){var requestPayload=arguments.length>5&&arguments[5]!==undefined?arguments[5]:'';return regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:_context.t0=httpRequestMethod;_context.t1=canonicalURI;_context.t2=canonicalQueryString;_context.t3=canonicalHeaders;_context.t4=signedHeaders;_context.next=7;return requestPayload?(0,_deps.hash)(requestPayload):emptyHash;case 7:_context.t5=_context.sent;return _context.abrupt('return',[_context.t0,_context.t1,_context.t2,_context.t3,'',_context.t4,_context.t5].join('\n'));case 9:case'end':return _context.stop();}}},_callee,this)}));return function buildCanonicalRequest(_x2,_x3,_x4,_x5,_x6){return _ref.apply(this,arguments)}}();var preCalculateSigningKey=exports.preCalculateSigningKey=function(){var _ref2=_asyncToGenerator(regeneratorRuntime.mark(function _callee3(secretAccessKey,date,region,service){var _this=this;return regeneratorRuntime.wrap(function _callee3$(_context3){while(1){switch(_context3.prev=_context3.next){case 0:return _context3.abrupt('return',[date,region,service,'aws4_request'].reduce(function(){var _ref3=_asyncToGenerator(regeneratorRuntime.mark(function _callee2(acc,val){return regeneratorRuntime.wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:_context2.t0=_deps.hmac;_context2.next=3;return acc;case 3:_context2.t1=_context2.sent;_context2.t2=val;return _context2.abrupt('return',(0,_context2.t0)(_context2.t1,_context2.t2));case 6:case'end':return _context2.stop();}}},_callee2,_this)}));return function(_x11,_x12){return _ref3.apply(this,arguments)}}(),`AWS4${secretAccessKey}`));case 1:case'end':return _context3.stop();}}},_callee3,this)}));return function preCalculateSigningKey(_x7,_x8,_x9,_x10){return _ref2.apply(this,arguments)}}();var sign=exports.sign=function(){var _ref4=_asyncToGenerator(regeneratorRuntime.mark(function _callee4(secretAccessKey,date,region,service,stringToSign){var signingKey;return regeneratorRuntime.wrap(function _callee4$(_context4){while(1){switch(_context4.prev=_context4.next){case 0:_context4.next=2;return preCalculateSigningKey(secretAccessKey,date,region,service);case 2:signingKey=_context4.sent;return _context4.abrupt('return',preCalculatedSign(signingKey,stringToSign));case 4:case'end':return _context4.stop();}}},_callee4,this)}));return function sign(_x13,_x14,_x15,_x16,_x17){return _ref4.apply(this,arguments)}}();exports.formatDateTime=formatDateTime;exports.buildStringToSign=buildStringToSign;exports.preCalculatedSign=preCalculatedSign;exports.buildAuthorization=buildAuthorization;var _deps=__webpack_require__(1);function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step('next',value)},function(err){step('throw',err)})}}return step('next')})}}exports.hash=_deps.hash;var algorithm='AWS4-HMAC-SHA256';var emptyHash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';function formatDateTime(date){return date.toISOString().replace(/-|:|(\.\d+)/g,'')}function buildStringToSign(requestDate,credentialScope,hashedCanonicalRequest){return[algorithm,requestDate,credentialScope,hashedCanonicalRequest].join('\n')}function preCalculatedSign(signingKey,stringToSign){return(0,_deps.hmac)(signingKey,stringToSign,'hex')}function buildAuthorization(accessKeyId,credentialScope,signedHeaders,signature){return algorithm+' '+[['Credential',`${accessKeyId}/${credentialScope}`],['SignedHeaders',signedHeaders],['Signature',signature]].map(function(item){return item.join('=')}).join(', ')}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
Object.defineProperty(exports,'__esModule',{value:true});var hmac=exports.hmac=function(){var _ref=_asyncToGenerator(regeneratorRuntime.mark(function _callee(key,data,encoding){var importedKey,buffer;return regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:_context.next=2;return subtle.importKey('raw',typeof key==='string'?toBinary(key):key,algorithmSign,false,['sign']);case 2:importedKey=_context.sent;_context.next=5;return subtle.sign(algorithmSign,importedKey,toBinary(data));case 5:buffer=_context.sent;return _context.abrupt('return',encoding==='hex'?toHex(buffer):buffer);case 7:case'end':return _context.stop();}}},_callee,this)}));return function hmac(_x,_x2,_x3){return _ref.apply(this,arguments)}}();var hash=exports.hash=function(){var _ref2=_asyncToGenerator(regeneratorRuntime.mark(function _callee2(data){return regeneratorRuntime.wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:_context2.t0=toHex;_context2.next=3;return subtle.digest(hashOptions,toBinary(data));case 3:_context2.t1=_context2.sent;return _context2.abrupt('return',(0,_context2.t0)(_context2.t1));case 5:case'end':return _context2.stop();}}},_callee2,this)}));return function hash(_x4){return _ref2.apply(this,arguments)}}();function _asyncToGenerator(fn){return function(){var gen=fn.apply(this,arguments);return new Promise(function(resolve,reject){function step(key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{return Promise.resolve(value).then(function(value){step('next',value)},function(err){step('throw',err)})}}return step('next')})}}var crypto=window.crypto||window.msCrypto;var subtle=crypto.subtle||crypto.webkitSubtle;var algorithm='sha-256';var normalize=exports.normalize=encodeURI;function toHex(buffer){var bytes=new Uint8Array(buffer);var str='';for(var i=0;i<bytes.length;++i){var byte=bytes[i].toString(16);str+=`${byte.length<2?'0':''}${byte}`}return str}var toBinary='TextEncoder'in window?function(str){return new TextEncoder().encode(str)}:function(str){var len=str.length;var buf=new ArrayBuffer(len*2);var bufView=new Uint16Array(buf);for(var i=0;i<len;i++){bufView[i]=str.charCodeAt(i)}return buf};var hashOptions={name:algorithm};var algorithmSign={name:'HMAC',hash:hashOptions};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ })
/******/ ]);
});
//# sourceMappingURL=index.js.map