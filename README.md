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
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/75a427334dad4aac843674b99bc40e8b)](https://www.codacy.com/app/barrett-harber/aws-sigv4?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=binoculars/aws-sigv4&amp;utm_campaign=Badge_Grade)

## Example
```JavaScript
const sigv4 = require('aws-sigv4');

sigv4.sign(
	secretAccessKey,
	requestDate.slice(0, 8),
	'us-east-1',
	'host',
	stringToSign
);

// Or, more specifically for S3:

const date = sigv4
	.formatDateTime(new Date())
	.slice(0, 8);
const credential = `${process.env.AWS_ACCESS_KEY_ID}/${date}/${process.env.AWS_REGION}/s3/aws4_request`
const policy = new Buffer(
	JSON.stringify({
	    expiration: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes from now
	    conditions: [
	        {bucket: 'my-bucket-name'},
	        {key: 'my-s3-key.mov'},
	        {acl: 'private'},
	        ['starts-with', '$Content-Type', 'video/'],
	        ['content-length-range', 0, 10 * 1024 * 1024],
	        {'x-amz-credential': credential},
	        {'x-amz-algorithm': 'AWS4-HMAC-SHA256'},
	        {'x-amz-date': date + 'T000000Z'}
	    ]
	})
)
	.toString('base64');

sigv4.sign(
	process.env.AWS_SECRET_ACCESS_KEY,
	date,
	process.env.AWS_REGION,
	's3',
	policy
);
```

See [Authenticating Requests in Browser-Based Uploads Using POST (AWS Signature Version 4)](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-UsingHTTPPOST.html) as the primary use case.