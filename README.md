# aws-sigv4

> A dependency-free, test suite-compliant, AWS Signature Version 4 library in ES6

[![NPM](https://nodei.co/npm/aws-sigv4.png?mini=true)](https://nodei.co/npm/aws-sigv4/)
[![npm version](https://badge.fury.io/js/aws-sigv4.svg)](https://badge.fury.io/js/aws-sigv4)
[![Build Status](https://travis-ci.org/binoculars/aws-sigv4.svg?branch=master)](https://travis-ci.org/binoculars/aws-sigv4)
[![ESDoc](http://binoculars.github.io/aws-sigv4/esdoc/badge.svg)](http://binoculars.github.io/aws-sigv4/esdoc/)
[![Dependency Status](https://david-dm.org/binoculars/aws-sigv4.svg)](https://david-dm.org/binoculars/aws-sigv4)
[![devDependency Status](https://david-dm.org/binoculars/aws-sigv4/dev-status.svg)](https://david-dm.org/binoculars/aws-sigv4#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/binoculars/aws-sigv4/badge.svg?branch=master&service=github)](https://coveralls.io/github/binoculars/aws-sigv4?branch=master)
[![Code Climate](https://codeclimate.com/github/binoculars/aws-sigv4/badges/gpa.svg)](https://codeclimate.com/github/binoculars/aws-sigv4)
[![Test Coverage](https://codeclimate.com/github/binoculars/aws-sigv4/badges/coverage.svg)](https://codeclimate.com/github/binoculars/aws-sigv4/coverage)
[![Issue Count](https://codeclimate.com/github/binoculars/aws-sigv4/badges/issue_count.svg)](https://codeclimate.com/github/binoculars/aws-sigv4) 

## Example
```JavaScript
var sigv4 = require('aws-sigv4');

sigv4.sign(
	secretAccessKey,
	requestDate.slice(0, 8),
	'us-east-1',
	'host',
	stringToSign
);
```