var express = require('express'),
	fs = require('fs');

module.exports.create = function(server, host, port, publicDir) {
	var app = express();
	app.use(express.static(publicDir));
	loadConfigs();
	loadFilesInfo();
	bind(app);
	return app;
};


var config = {};
var rawFiles = [];

function loadConfigs() {
	config = JSON.parse(fs.readFileSync('../../config.json'));
	console.log('CONFIG:', config);
}

function loadFilesInfo() {
	var mainFolder = config.images_folder,
		files = [];

	files = fs.readdirSync(mainFolder)
		.filter(function(dayFolder) {
			return /^-?[0-9]{8}$/.test(dayFolder);
		})
		.map(function(dayFolder) {
			return {
				name: dayFolder,
				images: fs.readdirSync(mainFolder + '/' + dayFolder).map(function(fileName) {
					return fileName;
				})
			};
		});

	rawFiles = files;

	/*
	    res = walk(imagesFolder);
	    function walk (dir) {
	        res = [];
	        var list = fs.readdirSync(dir);
	        list.forEach(function(fileName) {
	            file = dir + '/' + fileName;
	            var stat = fs.statSync(file);
	            if (stat && stat.isDirectory()) {
	                if(ignoreFolders.indexOf(fileName) == -1) {
	                    res = res.concat(walk(file));
	                }
	            } else {
	                if (fileName.indexOf('.html') > 0) {
	                    res.push(file);
	                }
	            }
	        });
	        return res;
	    }
	    return  res;
	    */
}

function getLastImage() {
	var mainFolder = config.images_folder,
		files = [];

	var lastDay = fs.readdirSync(mainFolder)
		.filter(function(dayFolder) {
			return /^-?[0-9]{8}$/.test(dayFolder);
		})
		.pop();
	var lastImage = fs.readdirSync(mainFolder + '/' + lastDay).pop();

	return { day: lastDay, image: lastImage};
}

function bind(app) {

	app.post('/images/last', function(req, res) {
		var lastImage = getLastImage();
		res.write(JSON.stringify(lastImage));
		res.end();
	});

	app.get('/image/:date/:name', function(req, res) {
		var date = req.params.date,
			name = req.params.name;
		var file_path = config.images_folder + '/' + date + '/' + name;
		console.log("IMG: ", file_path);
		fs.stat(file_path, function(error, stat) {
			var rs;
			res.writeHead(200, {
				'Content-Type': 'image/jpg',
				'Content-Length': stat.size
			});
			rs = fs.createReadStream(file_path);
			rs.pipe(res);
		});
	});
}