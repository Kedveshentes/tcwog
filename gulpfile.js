var gulp = require('gulp');
var uglify = require('gulp-uglify');


gulp.task('default', function () {
	
});

gulp.task('compress', function () {
	return gulp.src('app.js')
		.pipe(uglify({
        mangle: true,
        compress: true
    }))
		.pipe(gulp.dest('dist'));
});