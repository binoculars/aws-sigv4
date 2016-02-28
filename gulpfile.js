var gulp = require('gulp');
var download = require('gulp-download');
var unzip = require('gulp-unzip');
var fs = require('fs');

gulp.task('checkSuite', function(cb) {
	fs.stat('./test/fixtures/aws4_testsuite', function(err) {
		if (err) {
			return cb(null, download('https://docs.aws.amazon.com/general/latest/gr/samples/aws4_testsuite.zip')
				.pipe(unzip())
				.pipe(gulp.dest('./test/fixtures/aws4_testsuite'))
			);
		} else {
			cb(err);
		}
	});
});