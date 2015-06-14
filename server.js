/*var mymodule = require('./modules/mymodule.js');

function datCallback (error, data) {
	console.log(data);
}
mymodule(process.argv[2], process.argv[3], datCallback);*/




/*var lslib = require('./modules/mymodule.js');

var dirname = process.argv[2];
var ext = process.argv[3];

lslib(dirname, ext, function(err, files) {
  for (i = 0; i < files.length; i++) {
    console.log(files[i]);
  }
});*/

var filterFn = require('./modules/mymodule.js');
var dir = process.argv[2];
var filterStr = process.argv[3];

filterFn(dir, filterStr, function (err, list) {
	if (err) {
		return console.error('There was an error:', err);
	}

	list.forEach(function (file) {
		console.log(file);
	});
});
