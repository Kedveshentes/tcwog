/*var fs = require('fs');

module.exports = function (directory, format, callback) {
	fileBuffer = fs.readdir(directory, callback);
	var reg = new RegExp('.' + format + '$');
		for (var i = 0; i < data.length; i++) {
			if (reg.test(data[i])) {
				console.log(data[i]);
			}
		}
}*/



/*var fs = require('fs');
var path = require('path');

module.exports = function(dirname, ext, callback) {
  var extension = "." + ext;
  fs.readdir(dirname, function(err, files) {
    if (err) {
      callback(err, null);
    }
    else {
      result = [];
      files.forEach(function(entry) {
        if (path.extname(entry) == extension) {
          result.push(entry);
        }
      });
      callback(null, result);
    }
  });
  
};*/



var fs = require('fs')
var path = require('path')

module.exports = function (dir, filterStr, callback) {
	fs.readdir(dir, function (err, list) {
		if (err) {
			return callback(err)
		}

		list = list.filter(function (file) {
			return path.extname(file) === '.' + filterStr
		})

		callback(null, list)
	})
}
